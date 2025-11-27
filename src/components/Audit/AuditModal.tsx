import React, { useState, useEffect } from 'react';
import { FileText, X, Download, FileJson } from 'lucide-react';
import { SupabaseService } from '../../services/supabaseService';
import { useUser } from '../../contexts/UserContext';
import { ExportUtils } from '../../utils/exportUtils';
import { AuditRetentionService } from '../../services/auditRetentionService';
import AuditFiltersPanel from './AuditFiltersPanel';
import AuditTable from './AuditTable';
import AuditEventDetailModal from './AuditEventDetailModal';
import AuditComparisonModal from './AuditComparisonModal';
import toast from 'react-hot-toast';

interface AuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useUser();
  const [eventos, setEventos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [selectedEvento, setSelectedEvento] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  const [filters, setFilters] = useState({
    fechaInicio: '',
    fechaFin: '',
    tipos: [] as string[],
    modulos: [] as string[],
    usuarios: [] as string[],
    acciones: [] as string[],
    palabraClave: ''
  });
  const [exportingFormat, setExportingFormat] = useState<'excel' | 'pdf' | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadEventos();
    }
  }, [isOpen, currentPage, pageSize, filters]);

  const loadEventos = async () => {
    try {
      setLoading(true);

      const filtersCopy = { ...filters };

      if (currentUser?.perfil !== 'Administrador') {
        filtersCopy.usuarios = [currentUser?.nombre || ''];
      }

      const result = await SupabaseService.searchEventos({
        ...filtersCopy,
        limit: pageSize,
        offset: currentPage * pageSize
      });

      setEventos(result.data);
      setTotalCount(result.count);
    } catch (error) {
      console.error('Error loading eventos:', error);
      toast.error('Error al cargar eventos de auditoría');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setCurrentPage(0);
  };

  const handleSearch = (keyword: string) => {
    setCurrentPage(0);
  };

  const handleEventoClick = (evento: any) => {
    setSelectedEvento(evento);
    setShowComparisonModal(true);
  };

  const handleExportExcel = async () => {
    try {
      setExportingFormat('excel');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      ExportUtils.exportAuditToExcel(
        eventos,
        `audit-${timestamp}`,
        {
          exportedBy: currentUser?.nombre
        }
      );

      await AuditRetentionService.recordExport(
        currentUser?.nombre || 'Usuario',
        'excel',
        `audit-${timestamp}.xlsx`,
        eventos.length,
        filters.fechaInicio,
        filters.fechaFin
      );

      toast.success('Auditoría exportada a Excel correctamente');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Error al exportar a Excel');
    } finally {
      setExportingFormat(null);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExportingFormat('pdf');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      await ExportUtils.exportAuditToPDF(
        eventos,
        `audit-${timestamp}`,
        {
          exportedBy: currentUser?.nombre
        }
      );

      await AuditRetentionService.recordExport(
        currentUser?.nombre || 'Usuario',
        'pdf',
        `audit-${timestamp}.pdf`,
        eventos.length,
        filters.fechaInicio,
        filters.fechaFin
      );

      toast.success('Auditoría exportada a PDF correctamente');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Error al exportar a PDF');
    } finally {
      setExportingFormat(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full my-8">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Registro de Auditoría</h3>
                <p className="text-sm text-gray-600">
                  {currentUser?.perfil === 'Administrador'
                    ? 'Vista completa de todos los eventos'
                    : 'Tus eventos del sistema'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportExcel}
                disabled={exportingFormat !== null || eventos.length === 0}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Exportar a Excel sin límites"
              >
                <Download size={16} />
                <span>Excel</span>
              </button>
              <button
                onClick={handleExportPDF}
                disabled={exportingFormat !== null || eventos.length === 0}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Exportar a PDF sin límites"
              >
                <FileJson size={16} />
                <span>PDF</span>
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
            <AuditFiltersPanel
              onFiltersChange={handleFiltersChange}
              onSearch={handleSearch}
            />

            <AuditTable
              eventos={eventos}
              loading={loading}
              totalCount={totalCount}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(0);
              }}
              onEventoClick={handleEventoClick}
            />
          </div>

          <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {showDetailModal && selectedEvento && (
        <AuditEventDetailModal
          eventoId={selectedEvento.id}
          onClose={() => setShowDetailModal(false)}
          onNavigate={(eventoId) => {
            setSelectedEvento({ id: eventoId });
          }}
        />
      )}

      {showComparisonModal && selectedEvento && (
        <AuditComparisonModal
          eventoId={selectedEvento.id}
          onClose={() => setShowComparisonModal(false)}
        />
      )}
    </>
  );
};

export default AuditModal;
