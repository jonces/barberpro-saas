-- AlterTable: un movimiento de inventario puede quedar sin producto (huérfano)
-- si el producto se elimina después.
ALTER TABLE "MovimientoInventario" ALTER COLUMN "productoId" DROP NOT NULL;

-- DropForeignKey
ALTER TABLE "MovimientoInventario" DROP CONSTRAINT "MovimientoInventario_productoId_fkey";

-- AddForeignKey: eliminar el producto pone productoId en null en vez de bloquear el borrado
ALTER TABLE "MovimientoInventario" ADD CONSTRAINT "MovimientoInventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "ProveedorProducto" DROP CONSTRAINT "ProveedorProducto_productoId_fkey";

-- AddForeignKey: eliminar el producto borra en cascada su vínculo con proveedores
ALTER TABLE "ProveedorProducto" ADD CONSTRAINT "ProveedorProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
