import { create as createDiffPatcher } from 'jsondiffpatch';

export interface DiffChange {
  path: string;
  type: 'added' | 'removed' | 'modified';
  oldValue: any;
  newValue: any;
}

const patcher = createDiffPatcher();

export const parseJSON = (value: any): any => {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

export const getChanges = (oldData: any, newData: any): DiffChange[] => {
  const oldObj = parseJSON(oldData);
  const newObj = parseJSON(newData);

  if (!oldObj || !newObj) {
    return [];
  }

  const changes: DiffChange[] = [];

  const collectChanges = (obj: any, base: string = '') => {
    if (typeof obj !== 'object' || obj === null) return;

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const path = base ? `${base}.${key}` : key;
        const value = obj[key];

        if (Array.isArray(value) && value.length === 3) {
          const [oldVal, newVal] = value;
          if (Array.isArray(newVal)) {
            changes.push({
              path,
              type: 'modified',
              oldValue: oldVal,
              newValue: newVal
            });
          }
        } else if (Array.isArray(value) && value.length === 1) {
          changes.push({
            path,
            type: 'removed',
            oldValue: value[0],
            newValue: undefined
          });
        } else if (Array.isArray(value) && value.length === 2) {
          changes.push({
            path,
            type: 'modified',
            oldValue: value[0],
            newValue: value[1]
          });
        }
      }
    }
  };

  const diff = patcher.diff(oldObj, newObj);
  if (diff) {
    collectChanges(diff);
  }

  return changes;
};

export const getDetailedDifferences = (oldData: any, newData: any): Map<string, DiffChange> => {
  const oldObj = parseJSON(oldData) || {};
  const newObj = parseJSON(newData) || {};

  const differences = new Map<string, DiffChange>();
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  allKeys.forEach(key => {
    const oldVal = oldObj[key];
    const newVal = newObj[key];

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      if (!(key in oldObj) && key in newObj) {
        differences.set(key, {
          path: key,
          type: 'added',
          oldValue: undefined,
          newValue: newVal
        });
      } else if (key in oldObj && !(key in newObj)) {
        differences.set(key, {
          path: key,
          type: 'removed',
          oldValue: oldVal,
          newValue: undefined
        });
      } else {
        differences.set(key, {
          path: key,
          type: 'modified',
          oldValue: oldVal,
          newValue: newVal
        });
      }
    }
  });

  return differences;
};

export const formatValue = (value: any): string => {
  if (value === null) return 'null';
  if (value === undefined) return '(vacío)';
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

export const isEmptyData = (data: any): boolean => {
  if (!data) return true;
  const obj = parseJSON(data);
  if (!obj || Object.keys(obj).length === 0) return true;
  return false;
};
