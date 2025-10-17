import React, { useState, useEffect } from 'react';
import { Palette, Plus, Search, X, Trash2 } from 'lucide-react';
import Modal from '../Common/Modal';
import ConfirmDialog from '../Common/ConfirmDialog';
import { SupabaseService } from '../../services/supabaseService';
import toast from 'react-hot-toast';

interface Color {
  id: string;
  nombre: string;
  codigo_color?: string;
  descripcion?: string;
}

interface ColorManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onColorSelect: (colorNombre: string) => void;
}

const ColorManager: React.FC<ColorManagerProps> = ({ isOpen, onClose, onColorSelect }) => {
  const [colores, setColores] = useState<Color[]>([]);
  const [filteredColores, setFilteredColores] = useState<Color[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddColorModal, setShowAddColorModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newColorData, setNewColorData] = useState({
    nombre: '',
    codigo_color: '',
    descripcion: ''
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [colorToDelete, setColorToDelete] = useState<{ id: string; nombre: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadColores();
    }
  }, [isOpen]);

  useEffect(() => {
    filterColores();
  }, [colores, searchTerm]);

  const loadColores = async () => {
    try {
      setLoading(true);
      const data = await SupabaseService.getColores();
      setColores(data);
      setFilteredColores(data);
    } catch (error) {
      console.error('Error loading colors:', error);
      toast.error('Error al cargar colores');
    } finally {
      setLoading(false);
    }
  };

  const filterColores = () => {
    if (!searchTerm.trim()) {
      setFilteredColores(colores);
      return;
    }

    const filtered = colores.filter(color =>
      color.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      color.codigo_color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      color.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredColores(filtered);
  };

  const handleAddColor = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const colorData = {
        nombre: newColorData.nombre.trim(),
        codigo_color: newColorData.codigo_color.trim() || undefined,
        descripcion: newColorData.descripcion.trim() || undefined
      };

      const nuevoColor = await SupabaseService.createColor(colorData);

      setColores([nuevoColor, ...colores]);
      setNewColorData({ nombre: '', codigo_color: '', descripcion: '' });
      setShowAddColorModal(false);

      toast.success('Color registrado correctamente');
    } catch (error: any) {
      console.error('Error creating color:', error);
      toast.error('Error al registrar color');
    }
  };

  const handleSelectColor = (color: Color) => {
    onColorSelect(color.nombre);
    onClose();
    toast.success(`Color "${color.nombre}" seleccionado`);
  };

  const handleDeleteColor = (e: React.MouseEvent, colorId: string, colorNombre: string) => {
    e.stopPropagation();
    setColorToDelete({ id: colorId, nombre: colorNombre });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteColor = async () => {
    if (!colorToDelete) return;

    try {
      await SupabaseService.deleteColor(colorToDelete.id);
      setColores(colores.filter(c => c.id !== colorToDelete.id));
      toast.success('Color eliminado correctamente');
    } catch (error: any) {
      console.error('Error deleting color:', error);
      toast.error('Error al eliminar color');
    } finally {
      setColorToDelete(null);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Lista de Colores Disponibles"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar color por nombre, código o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowAddColorModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Agregar</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Cargando colores...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {filteredColores.map(color => (
                <div
                  key={color.id}
                  onClick={() => handleSelectColor(color)}
                  className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {color.codigo_color && (
                        <div
                          className="w-8 h-8 rounded border border-gray-300 flex-shrink-0"
                          style={{ backgroundColor: color.codigo_color }}
                        ></div>
                      )}
                      {!color.codigo_color && (
                        <Palette className="w-8 h-8 text-gray-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{color.nombre}</p>
                        {color.codigo_color && (
                          <p className="text-xs text-gray-500">{color.codigo_color}</p>
                        )}
                        {color.descripcion && (
                          <p className="text-xs text-gray-600 truncate">{color.descripcion}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteColor(e, color.id, color.nombre)}
                      className="ml-2 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar color"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredColores.length === 0 && (
            <div className="text-center py-8">
              <Palette className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-500">No se encontraron colores</p>
              <p className="text-sm text-gray-400 mt-1">Intenta con otra búsqueda o agrega un nuevo color</p>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showAddColorModal}
        onClose={() => {
          setShowAddColorModal(false);
          setNewColorData({ nombre: '', codigo_color: '', descripcion: '' });
        }}
        title="Registro de Color"
        size="md"
      >
        <form onSubmit={handleAddColor} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newColorData.nombre}
              onChange={(e) => setNewColorData({ ...newColorData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Rojo Carmesí"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código de Color
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newColorData.codigo_color}
                onChange={(e) => setNewColorData({ ...newColorData, codigo_color: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: #FF5733"
              />
              {newColorData.codigo_color && (
                <div
                  className="w-10 h-10 rounded border border-gray-300"
                  style={{ backgroundColor: newColorData.codigo_color }}
                ></div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Formato hexadecimal: #RRGGBB</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={newColorData.descripcion}
              onChange={(e) => setNewColorData({ ...newColorData, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Descripción adicional del color (opcional)"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setShowAddColorModal(false);
                setNewColorData({ nombre: '', codigo_color: '', descripcion: '' });
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Registrar Color
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setColorToDelete(null);
        }}
        onConfirm={confirmDeleteColor}
        title="Eliminar Color"
        message={`¿Está seguro de que desea eliminar el color "${colorToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </>
  );
};

export default ColorManager;
