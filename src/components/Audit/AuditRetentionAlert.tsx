import React, { useState, useEffect } from 'react';
import { AlertCircle, Download, X, Clock } from 'lucide-react';
import { AuditRetentionService, RetentionEligibleEvent } from '../../services/auditRetentionService';
import AuditRetentionModal from './AuditRetentionModal';
import toast from 'react-hot-toast';

interface AuditRetentionAlertProps {
  userId: string;
}

const AuditRetentionAlert: React.FC<AuditRetentionAlertProps> = ({ userId }) => {
  const [showAlert, setShowAlert] = useState(false);
  const [pendingEvents, setPendingEvents] = useState<RetentionEligibleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [daysUntilDeletion, setDaysUntilDeletion] = useState(0);

  useEffect(() => {
    loadRetentionData();
    const interval = setInterval(loadRetentionData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadRetentionData = async () => {
    try {
      setLoading(true);
      const eligibleEvents = await AuditRetentionService.getRetentionEligibleEvents();
      setPendingEvents(eligibleEvents);

      if (eligibleEvents.length > 0) {
        const minDays = Math.min(...eligibleEvents.map(e => e.days_until_deletion));
        setDaysUntilDeletion(minDays);
        setShowAlert(true);
      } else {
        setShowAlert(false);
      }
    } catch (error) {
      console.error('Error loading retention data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !showAlert || pendingEvents.length === 0) {
    return null;
  }

  const criticalCount = pendingEvents.filter(e => e.days_until_deletion <= 7).length;
  const isCritical = daysUntilDeletion <= 7;

  return (
    <>
      <div className={`rounded-lg border-l-4 p-4 mb-4 ${
        isCritical
          ? 'bg-red-50 border-red-500 text-red-800'
          : 'bg-amber-50 border-amber-500 text-amber-800'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <AlertCircle className={`flex-shrink-0 w-5 h-5 ${isCritical ? 'text-red-600' : 'text-amber-600'}`} />
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">
                Registros de auditoría próximos a expiración
              </h3>
              <div className="text-sm space-y-1">
                <p>
                  Tienes {pendingEvents.length} evento{pendingEvents.length !== 1 ? 's' : ''}
                  {criticalCount > 0 && ` (${criticalCount} crítico${criticalCount !== 1 ? 's' : ''})`}
                  próximo{pendingEvents.length !== 1 ? 's' : ''} a ser eliminado{pendingEvents.length !== 1 ? 's' : ''}.
                </p>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    Días hasta eliminación:
                    <span className={`font-bold ml-1 ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
                      {daysUntilDeletion} día{daysUntilDeletion !== 1 ? 's' : ''}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => setShowModal(true)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                isCritical
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
            <button
              onClick={() => setShowAlert(false)}
              className="p-1.5 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <AuditRetentionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          pendingEvents={pendingEvents}
          userId={userId}
        />
      )}
    </>
  );
};

export default AuditRetentionAlert;
