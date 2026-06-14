using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.Reports;

// --- DTOs ---
public record ConsumptionReportDto(string DepartmentName, string ArticleName, string ArticleReference, decimal TotalQuantity, string Unit, int MovementCount);
public record ValuationReportDto(string ArticleName, string ArticleReference, string WarehouseName, decimal TotalQuantity, string Unit, decimal UnitCost, decimal TotalValue, string Currency);
public record MovementSummaryDto(string Type, string TypeFr, int Count, decimal TotalQuantity);
public record TopItemDto(string ArticleName, string ArticleReference, decimal TotalQuantity, string Unit, int MovementCount);

// --- Queries ---
public record GetConsumptionReportQuery(DateTime? FromDate, DateTime? ToDate, Guid? DepartmentId, Guid? WarehouseId) : IRequest<Result<IEnumerable<ConsumptionReportDto>>>;
public record GetValuationReportQuery(Guid? WarehouseId) : IRequest<Result<IEnumerable<ValuationReportDto>>>;
public record GetMovementSummaryQuery(DateTime? FromDate, DateTime? ToDate) : IRequest<Result<IEnumerable<MovementSummaryDto>>>;
public record GetTopItemsQuery(DateTime? FromDate, DateTime? ToDate, int Top = 10) : IRequest<Result<IEnumerable<TopItemDto>>>;

// --- Handlers ---
public class ReportsQueryHandlers :
    IRequestHandler<GetConsumptionReportQuery, Result<IEnumerable<ConsumptionReportDto>>>,
    IRequestHandler<GetValuationReportQuery, Result<IEnumerable<ValuationReportDto>>>,
    IRequestHandler<GetMovementSummaryQuery, Result<IEnumerable<MovementSummaryDto>>>,
    IRequestHandler<GetTopItemsQuery, Result<IEnumerable<TopItemDto>>>
{
    private readonly StockDbContext _ctx;
    public ReportsQueryHandlers(StockDbContext ctx) => _ctx = ctx;

    // Consommation par département
    public async Task<Result<IEnumerable<ConsumptionReportDto>>> Handle(GetConsumptionReportQuery request, CancellationToken ct)
    {
        var movementsQuery = _ctx.StockMovements.AsNoTracking()
            .Include(m => m.Lines)
            .Where(m => m.Type == Domain.Enums.StockMovementType.Issue && m.Status == Domain.Enums.StockMovementStatus.Confirmed);

        if (request.FromDate.HasValue) movementsQuery = movementsQuery.Where(m => m.MovementDate >= request.FromDate.Value);
        if (request.ToDate.HasValue) movementsQuery = movementsQuery.Where(m => m.MovementDate <= request.ToDate.Value);
        if (request.DepartmentId.HasValue) movementsQuery = movementsQuery.Where(m => m.DepartmentId == request.DepartmentId.Value);
        if (request.WarehouseId.HasValue) movementsQuery = movementsQuery.Where(m => m.SourceWarehouseId == request.WarehouseId.Value);

        var movements = await movementsQuery.ToListAsync(ct);
        var deptIds = movements.Where(m => m.DepartmentId.HasValue).Select(m => m.DepartmentId!.Value).Distinct().ToList();
        var itemIds = movements.SelectMany(m => m.Lines).Select(l => l.StockItemId).Distinct().ToList();

        var departments = await _ctx.Departments.Where(d => deptIds.Contains(d.Id)).ToListAsync(ct);
        var items = await _ctx.StockItems.Where(i => itemIds.Contains(i.Id)).ToListAsync(ct);

        var rows = movements
            .SelectMany(m => m.Lines.Select(l => new { Movement = m, Line = l }))
            .GroupBy(x => new { x.Movement.DepartmentId, x.Line.StockItemId, x.Line.Quantity.Unit })
            .Select(g =>
            {
                var dept = g.Key.DepartmentId.HasValue ? departments.FirstOrDefault(d => d.Id == g.Key.DepartmentId.Value)?.Name ?? "—" : "—";
                var item = items.FirstOrDefault(i => i.Id == g.Key.StockItemId);
                return new ConsumptionReportDto(dept, item?.Name ?? "—", item?.Reference ?? "—", g.Sum(x => x.Line.Quantity.Value), g.Key.Unit.ToString(), g.Count());
            })
            .OrderBy(r => r.DepartmentName).ThenByDescending(r => r.TotalQuantity);

        return Result<IEnumerable<ConsumptionReportDto>>.Success(rows);
    }

    // Valorisation du stock
    public async Task<Result<IEnumerable<ValuationReportDto>>> Handle(GetValuationReportQuery request, CancellationToken ct)
    {
        var lotsQuery = _ctx.StockLots.AsNoTracking().Where(l => l.CurrentQuantity.Value > 0);
        if (request.WarehouseId.HasValue) lotsQuery = lotsQuery.Where(l => l.WarehouseId == request.WarehouseId.Value);

        var lots = await lotsQuery.ToListAsync(ct);
        var itemIds = lots.Select(l => l.StockItemId).Distinct().ToList();
        var warehouseIds = lots.Select(l => l.WarehouseId).Distinct().ToList();

        var items = await _ctx.StockItems.Where(i => itemIds.Contains(i.Id)).ToListAsync(ct);
        var warehouses = await _ctx.Warehouses.Where(w => warehouseIds.Contains(w.Id)).ToListAsync(ct);

        var rows = lots.Select(l =>
        {
            var item = items.FirstOrDefault(i => i.Id == l.StockItemId);
            var wh = warehouses.FirstOrDefault(w => w.Id == l.WarehouseId);
            return new ValuationReportDto(item?.Name ?? "—", item?.Reference ?? "—", wh?.Name ?? "—",
                l.CurrentQuantity.Value, l.CurrentQuantity.Unit.ToString(),
                l.UnitCost.Amount, l.CurrentQuantity.Value * l.UnitCost.Amount, l.UnitCost.Currency);
        }).OrderBy(r => r.ArticleName).ToList();

        return Result<IEnumerable<ValuationReportDto>>.Success(rows);
    }

    // Résumé des mouvements
    public async Task<Result<IEnumerable<MovementSummaryDto>>> Handle(GetMovementSummaryQuery request, CancellationToken ct)
    {
        var q = _ctx.StockMovements.AsNoTracking().Include(m => m.Lines)
            .Where(m => m.Status == Domain.Enums.StockMovementStatus.Confirmed);
        if (request.FromDate.HasValue) q = q.Where(m => m.MovementDate >= request.FromDate.Value);
        if (request.ToDate.HasValue) q = q.Where(m => m.MovementDate <= request.ToDate.Value);

        var movements = await q.ToListAsync(ct);
        var typeFrMap = new Dictionary<string, string>
        {
            ["Reception"] = "Réception", ["Issue"] = "Sortie", ["Transfer"] = "Transfert",
            ["Return"] = "Retour", ["Adjustment"] = "Ajustement", ["Disposal"] = "Mise au rebut"
        };

        var rows = movements.GroupBy(m => m.Type.ToString())
            .Select(g => new MovementSummaryDto(g.Key,
                typeFrMap.TryGetValue(g.Key, out var fr) ? fr : g.Key,
                g.Count(),
                g.SelectMany(m => m.Lines).Sum(l => l.Quantity.Value)))
            .OrderBy(r => r.Type);

        return Result<IEnumerable<MovementSummaryDto>>.Success(rows);
    }

    // Top articles consommés
    public async Task<Result<IEnumerable<TopItemDto>>> Handle(GetTopItemsQuery request, CancellationToken ct)
    {
        var q = _ctx.StockMovements.AsNoTracking().Include(m => m.Lines)
            .Where(m => m.Type == Domain.Enums.StockMovementType.Issue && m.Status == Domain.Enums.StockMovementStatus.Confirmed);
        if (request.FromDate.HasValue) q = q.Where(m => m.MovementDate >= request.FromDate.Value);
        if (request.ToDate.HasValue) q = q.Where(m => m.MovementDate <= request.ToDate.Value);

        var movements = await q.ToListAsync(ct);
        var itemIds = movements.SelectMany(m => m.Lines).Select(l => l.StockItemId).Distinct().ToList();
        var items = await _ctx.StockItems.Where(i => itemIds.Contains(i.Id)).ToListAsync(ct);

        var rows = movements.SelectMany(m => m.Lines)
            .GroupBy(l => new { l.StockItemId, l.Quantity.Unit })
            .Select(g =>
            {
                var item = items.FirstOrDefault(i => i.Id == g.Key.StockItemId);
                return new TopItemDto(item?.Name ?? "—", item?.Reference ?? "—", g.Sum(l => l.Quantity.Value), g.Key.Unit.ToString(), g.Count());
            })
            .OrderByDescending(r => r.TotalQuantity)
            .Take(request.Top);

        return Result<IEnumerable<TopItemDto>>.Success(rows);
    }
}
