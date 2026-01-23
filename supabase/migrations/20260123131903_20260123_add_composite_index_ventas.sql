/*
  # Add Composite Index for Ventas Optimization

  1. New Index
    - Composite index on ventas(id_usuario, saldo_pendiente)
    - Accelerates financial data queries for filtering deudas
    - Improves RPC query performance when filtering by user and debt status
*/

CREATE INDEX IF NOT EXISTS idx_ventas_usuario_saldo_pendiente 
ON public.ventas (id_usuario, saldo_pendiente);
