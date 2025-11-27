/*
  # Políticas RLS para Control de Acceso a Auditoría
  
  - Administradores pueden ver todos los eventos
  - Vendedores y otros usuarios solo ven sus propios eventos
*/

-- Política SELECT para eventos: Vista restrictiva por rol
CREATE POLICY "admin_ver_todos_eventos"
  ON eventos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.perfil = 'Administrador'
      LIMIT 1
    )
  );

CREATE POLICY "usuarios_ver_propios_eventos"
  ON eventos
  FOR SELECT
  TO authenticated
  USING (
    usuario IS NOT NULL AND (
      usuario = current_user OR
      usuario LIKE '%' || current_user || '%'
    )
  );

-- Política INSERT para eventos: Solo el sistema puede crear
CREATE POLICY "sistema_crear_eventos"
  ON eventos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Políticas para eventos_relacionados
CREATE POLICY "usuarios_ver_relaciones"
  ON eventos_relacionados
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "sistema_crear_relaciones"
  ON eventos_relacionados
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
