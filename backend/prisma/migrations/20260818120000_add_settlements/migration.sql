-- CreateEnum
CREATE TYPE "MetodoPagoLiquidacion" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoAjuste" AS ENUM ('BONO', 'DEDUCCION', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO');

-- CreateEnum
CREATE TYPE "EstadoLiquidacion" AS ENUM ('CONFIRMADA', 'PAGADA', 'ANULADA');

-- AlterTable
ALTER TABLE "Comision" ADD COLUMN     "liquidacionId" TEXT;

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "barberiaId" TEXT NOT NULL,
    "barberoId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "periodoDesde" TIMESTAMP(3) NOT NULL,
    "periodoHasta" TIMESTAMP(3) NOT NULL,
    "totalComisiones" DECIMAL(10,2) NOT NULL,
    "totalPropinas" DECIMAL(10,2) NOT NULL,
    "totalBonos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalDeducciones" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAdelantos" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "montoCalculado" DECIMAL(10,2) NOT NULL,
    "montoPagado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "estado" "EstadoLiquidacion" NOT NULL DEFAULT 'CONFIRMADA',
    "notas" TEXT,
    "creadoPorId" TEXT NOT NULL,
    "anuladoPorId" TEXT,
    "motivoAnulacion" TEXT,
    "anuladoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Advance" (
    "id" TEXT NOT NULL,
    "barberiaId" TEXT NOT NULL,
    "barberoId" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "metodo" "MetodoPagoLiquidacion" NOT NULL DEFAULT 'EFECTIVO',
    "motivo" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responsableId" TEXT NOT NULL,
    "settlementId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Advance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adjustment" (
    "id" TEXT NOT NULL,
    "barberiaId" TEXT NOT NULL,
    "barberoId" TEXT NOT NULL,
    "tipo" "TipoAjuste" NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "motivo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responsableId" TEXT NOT NULL,
    "settlementId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Adjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementPayment" (
    "id" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "metodo" "MetodoPagoLiquidacion" NOT NULL DEFAULT 'EFECTIVO',
    "referencia" TEXT,
    "notas" TEXT,
    "registradoPorId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Settlement_numero_key" ON "Settlement"("numero");

-- CreateIndex
CREATE INDEX "Settlement_barberiaId_barberoId_estado_idx" ON "Settlement"("barberiaId", "barberoId", "estado");

-- CreateIndex
CREATE INDEX "Advance_barberiaId_barberoId_settlementId_idx" ON "Advance"("barberiaId", "barberoId", "settlementId");

-- CreateIndex
CREATE INDEX "Adjustment_barberiaId_barberoId_settlementId_idx" ON "Adjustment"("barberiaId", "barberoId", "settlementId");

-- CreateIndex
CREATE INDEX "Comision_liquidacionId_idx" ON "Comision"("liquidacionId");

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_barberiaId_fkey" FOREIGN KEY ("barberiaId") REFERENCES "Barberia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_barberoId_fkey" FOREIGN KEY ("barberoId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_anuladoPorId_fkey" FOREIGN KEY ("anuladoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advance" ADD CONSTRAINT "Advance_barberiaId_fkey" FOREIGN KEY ("barberiaId") REFERENCES "Barberia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advance" ADD CONSTRAINT "Advance_barberoId_fkey" FOREIGN KEY ("barberoId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advance" ADD CONSTRAINT "Advance_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Advance" ADD CONSTRAINT "Advance_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjustment" ADD CONSTRAINT "Adjustment_barberiaId_fkey" FOREIGN KEY ("barberiaId") REFERENCES "Barberia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjustment" ADD CONSTRAINT "Adjustment_barberoId_fkey" FOREIGN KEY ("barberoId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjustment" ADD CONSTRAINT "Adjustment_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjustment" ADD CONSTRAINT "Adjustment_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementPayment" ADD CONSTRAINT "SettlementPayment_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementPayment" ADD CONSTRAINT "SettlementPayment_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comision" ADD CONSTRAINT "Comision_liquidacionId_fkey" FOREIGN KEY ("liquidacionId") REFERENCES "Settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
