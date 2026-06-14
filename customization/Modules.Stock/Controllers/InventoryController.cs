using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Application.StockMovements.Commands.ConfirmMovement;
using Modules.Stock.Domain.Entities;
using Modules.Stock.Domain.Enums;
using Modules.Stock.Domain.Services;
using Modules.Stock.Domain.ValueObjects;
using Modules.Stock.Infrastructure.Persistence;

namespace Modules.Stock.Controllers;

public class InventorySession
{
    public Guid Id { get; set; }
    public Guid WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public List<InventoryItem> Items { get; set; } = new();
    public bool IsValidated { get; set; }
}

public class InventoryItem
{
    public Guid StockItemId { get; set; }
    public Guid StockLotId { get; set; }
    public string LotNumber { get; set; } = string.Empty;
    public string ArticleName { get; set; } = string.Empty;
    public string ArticleReference { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal TheoreticalQuantity { get; set; }
    public decimal PhysicalQuantity { get; set; }
    public decimal Gap => PhysicalQuantity - TheoreticalQuantity;
    public bool IsCounted { get; set; }
}

public class StartSessionRequest
{
    public Guid WarehouseId { get; set; }
}

public class CountRequest
{
    public Guid StockLotId { get; set; }
    public decimal PhysicalQuantity { get; set; }
}

public interface IInventorySessionManager
{
    InventorySession StartSession(Guid warehouseId, string warehouseName, List<InventoryItem> items);
    InventorySession? GetSession(Guid sessionId);
    void UpdateCounts(Guid sessionId, List<CountRequest> counts);
    void ValidateSession(Guid sessionId);
}

public class InventorySessionManager : IInventorySessionManager
{
    private readonly ConcurrentDictionary<Guid, InventorySession> _sessions = new();

    public InventorySession StartSession(Guid warehouseId, string warehouseName, List<InventoryItem> items)
    {
        var session = new InventorySession
        {
            Id = Guid.NewGuid(),
            WarehouseId = warehouseId,
            WarehouseName = warehouseName,
            StartedAt = DateTime.UtcNow,
            Items = items
        };
        _sessions[session.Id] = session;
        return session;
    }

    public InventorySession? GetSession(Guid sessionId)
    {
        _sessions.TryGetValue(sessionId, out var session);
        return session;
    }

    public void UpdateCounts(Guid sessionId, List<CountRequest> counts)
    {
        if (_sessions.TryGetValue(sessionId, out var session))
        {
            foreach (var count in counts)
            {
                var item = session.Items.FirstOrDefault(i => i.StockLotId == count.StockLotId);
                if (item != null)
                {
                    item.PhysicalQuantity = count.PhysicalQuantity;
                    item.IsCounted = true;
                }
            }
        }
    }

    public void ValidateSession(Guid sessionId)
    {
        if (_sessions.TryGetValue(sessionId, out var session))
        {
            session.IsValidated = true;
        }
    }
}

[ApiController]
[Route("api/stock/[controller]")]
public class InventoryController : ControllerBase
{
    private readonly StockDbContext _context;
    private readonly IInventorySessionManager _sessionManager;
    private readonly IMovementNumberGenerator _numberGenerator;
    private readonly IMediator _mediator;

    public InventoryController(
        StockDbContext context,
        IInventorySessionManager sessionManager,
        IMovementNumberGenerator numberGenerator,
        IMediator mediator)
    {
        _context = context;
        _sessionManager = sessionManager;
        _numberGenerator = numberGenerator;
        _mediator = mediator;
    }

    [HttpPost("start")]
    public async Task<IActionResult> Start([FromBody] StartSessionRequest request)
    {
        var warehouse = await _context.Warehouses.FindAsync(request.WarehouseId);
        if (warehouse == null) return NotFound("Warehouse not found");

        // Fetch all active lots in this warehouse
        var lots = await _context.StockLots
            .Where(l => l.WarehouseId == request.WarehouseId && l.CurrentQuantity.Value > 0)
            .ToListAsync();

        var itemIds = lots.Select(l => l.StockItemId).Distinct().ToList();
        var items = await _context.StockItems
            .Where(i => itemIds.Contains(i.Id))
            .ToListAsync();

        var inventoryItems = lots.Select(l =>
        {
            var item = items.FirstOrDefault(i => i.Id == l.StockItemId);
            return new InventoryItem
            {
                StockItemId = l.StockItemId,
                StockLotId = l.Id,
                LotNumber = l.LotNumber?.Value ?? string.Empty,
                ArticleName = item?.Name ?? "Inconnu",
                ArticleReference = item?.Reference ?? "Inconnu",
                Unit = l.CurrentQuantity.Unit.ToString(),
                TheoreticalQuantity = l.CurrentQuantity.Value,
                PhysicalQuantity = l.CurrentQuantity.Value, // default to theoretical
                IsCounted = false
            };
        }).ToList();

        var session = _sessionManager.StartSession(request.WarehouseId, warehouse.Name, inventoryItems);
        return Ok(session);
    }

    [HttpGet("{sessionId}")]
    public IActionResult GetSession(Guid sessionId)
    {
        var session = _sessionManager.GetSession(sessionId);
        if (session == null) return NotFound("Session not found");
        return Ok(session);
    }

    [HttpPost("{sessionId}/count")]
    public IActionResult Count(Guid sessionId, [FromBody] List<CountRequest> counts)
    {
        var session = _sessionManager.GetSession(sessionId);
        if (session == null) return NotFound("Session not found");
        if (session.IsValidated) return BadRequest("Session already validated");

        _sessionManager.UpdateCounts(sessionId, counts);
        return Ok(session);
    }

    [HttpGet("{sessionId}/gaps")]
    public IActionResult GetGaps(Guid sessionId)
    {
        var session = _sessionManager.GetSession(sessionId);
        if (session == null) return NotFound("Session not found");

        var gaps = session.Items.Where(i => i.Gap != 0).ToList();
        return Ok(new { session.Id, session.WarehouseId, session.WarehouseName, session.StartedAt, session.IsValidated, Items = gaps });
    }

    [HttpPost("{sessionId}/validate")]
    public async Task<IActionResult> Validate(Guid sessionId)
    {
        var session = _sessionManager.GetSession(sessionId);
        if (session == null) return NotFound("Session not found");
        if (session.IsValidated) return BadRequest("Session already validated");

        var discrepancies = session.Items.Where(i => i.Gap != 0).ToList();
        if (discrepancies.Count > 0)
        {
            // 1. Generate movement number
            var movementNumber = await _numberGenerator.GenerateAsync(StockMovementType.Adjustment);

            // 2. Create Adjustment movement
            var movement = StockMovement.CreateAdjustment(
                movementNumber,
                session.WarehouseId,
                DateTime.UtcNow,
                "Système (Inventaire)",
                $"Ajustement automatique d'inventaire suite au comptage de la session {session.Id.ToString()[..8]}"
            );

            // 3. Add lines
            foreach (var item in discrepancies)
            {
                // Fetch the lot
                var lot = await _context.StockLots.FirstOrDefaultAsync(l => l.Id == item.StockLotId);
                if (lot != null)
                {
                    var qty = Quantity.Create(item.PhysicalQuantity, lot.CurrentQuantity.Unit);
                    var cost = lot.UnitCost;
                    movement.AddLine(
                        item.StockItemId,
                        item.StockLotId,
                        qty,
                        cost,
                        lot.ExpiryDate,
                        lot.SerialNumber,
                        $"Écart d'inventaire: physique={item.PhysicalQuantity} vs théorique={item.TheoreticalQuantity}"
                    );
                }
            }

            // 4. Save and confirm
            _context.StockMovements.Add(movement);
            await _context.SaveChangesAsync();

            // 5. Confirm using mediator to trigger domain events and stock lot adjustments
            var confirmResult = await _mediator.Send(new ConfirmMovementCommand(movement.Id));
            if (!confirmResult.IsSuccess)
            {
                return BadRequest(confirmResult.Error);
            }
        }

        _sessionManager.ValidateSession(sessionId);
        return Ok(session);
    }
}
