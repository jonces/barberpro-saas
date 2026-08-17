-- CreateEnum
CREATE TYPE "EstadoComision" AS ENUM ('PENDIENTE', 'LIQUIDADA', 'PARCIAL', 'ANULADA');

-- CreateEnum
CREATE TYPE "EstadoComisionRegla" AS ENUM ('ACTIVA', 'INACTIVA');

-- AlterEnum
ALTER TYPE "Rol" ADD VALUE 'GERENTE_GENERAL';

-- AlterTable
ALTER TABLE "ItemVenta" ADD COLUMN     "propina" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Comision" ADD COLUMN     "barberiaId" TEXT NOT NULL,
ADD COLUMN     "itemVentaId" TEXT,
ADD COLUMN     "commissionRuleId" TEXT,
ADD COLUMN     "montoBarberia" DECIMAL(10,2),
ADD COLUMN     "porcentajeBarberia" DECIMAL(5,2),
ADD COLUMN     "propina" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "estado" "EstadoComision" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "motivoAnulacion" TEXT;

-- CreateTable
CREATE TABLE "CommissionRule" (
    "id" TEXT NOT NULL,
    "barberiaId" TEXT NOT NULL,
    "sucursalId" TEXT,
    "barberoId" TEXT,
    "servicioId" TEXT,
    "barberoPct" DECIMAL(5,2) NOT NULL,
    "barberiaPct" DECIMAL(5,2) NOT NULL,
    "vigenteDesde" TIMESTAMP(3) NOT NULL,
    "vigenteHasta" TIMESTAMP(3),
    "estado" "EstadoComisionRegla" NOT NULL DEFAULT 'ACTIVA',
    "motivo" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "creadoPorId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionRuleHistory" (
    "id" TEXT NOT NULL,
    "barberiaId" TEXT NOT NULL,
    "reglaNuevaId" TEXT NOT NULL,
    "reglaAnteriorId" TEXT,
    "barberoId" TEXT,
    "sucursalId" TEXT,
    "servicioId" TEXT,
    "barberoPctAnterior" DECIMAL(5,2),
    "barberiaPctAnterior" DECIMAL(5,2),
    "barberoPctNuevo" DECIMAL(5,2) NOT NULL,
    "barberiaPctNuevo" DECIMAL(5,2) NOT NULL,
    "motivo" TEXT,
    "actorUserId" TEXT NOT NULL,
    "actorNombre" TEXT NOT NULL,
    "actorRol" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionRuleHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comision_barberiaId_usuarioId_estado_idx" ON "Comision"("barberiaId", "usuarioId", "estado");

-- CreateIndex
CREATE INDEX "CommissionRule_barberiaId_barberoId_servicioId_estado_idx" ON "CommissionRule"("barberiaId", "barberoId", "servicioId", "estado");

-- CreateIndex
CREATE INDEX "CommissionRule_barberiaId_sucursalId_estado_idx" ON "CommissionRule"("barberiaId", "sucursalId", "estado");

-- CreateIndex
CREATE INDEX "CommissionRuleHistory_barberiaId_barberoId_idx" ON "CommissionRuleHistory"("barberiaId", "barberoId");

-- AddForeignKey
ALTER TABLE "Comision" ADD CONSTRAINT "Comision_barberiaId_fkey" FOREIGN KEY ("barberiaId") REFERENCES "Barberia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comision" ADD CONSTRAINT "Comision_itemVentaId_fkey" FOREIGN KEY ("itemVentaId") REFERENCES "ItemVenta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comision" ADD CONSTRAINT "Comision_commissionRuleId_fkey" FOREIGN KEY ("commissionRuleId") REFERENCES "CommissionRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionRule" ADD CONSTRAINT "CommissionRule_barberiaId_fkey" FOREIGN KEY ("barberiaId") REFERENCES "Barberia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionRule" ADD CONSTRAINT "CommissionRule_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionRule" ADD CONSTRAINT "CommissionRule_barberoId_fkey" FOREIGN KEY ("barberoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionRule" ADD CONSTRAINT "CommissionRule_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionRule" ADD CONSTRAINT "CommissionRule_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionRuleHistory" ADD CONSTRAINT "CommissionRuleHistory_barberiaId_fkey" FOREIGN KEY ("barberiaId") REFERENCES "Barberia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionRuleHistory" ADD CONSTRAINT "CommissionRuleHistory_reglaNuevaId_fkey" FOREIGN KEY ("reglaNuevaId") REFERENCES "CommissionRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
