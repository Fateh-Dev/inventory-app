using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Infrastructure.Persistence;

namespace Modules.Stock.Controllers;

public class AuditLogDto
{
    public DateTime Timestamp { get; set; }
    public string User { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty; // "Création", "Confirmation", "Annulation"
    public string EntityType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Reference { get; set; } = string.Empty;
}

[ApiController]
[Route("api/stock/[controller]")]
public class AuditController : ControllerBase
{
    private readonly StockDbContext _context;

    public AuditController(StockDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AuditLogDto>>> GetAuditLogs(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] string? user,
        [FromQuery] string? actionType)
    {
        var query = _context.StockMovements.AsNoTracking().AsQueryable();

        if (fromDate.HasValue) query = query.Where(m => m.MovementDate >= fromDate.Value);
        if (toDate.HasValue) query = query.Where(m => m.MovementDate <= toDate.Value);
        if (!string.IsNullOrEmpty(user)) query = query.Where(m => m.CreatedByUser.ToLower().Contains(user.ToLower()));

        var movements = await query.OrderByDescending(m => m.MovementDate).Take(200).ToListAsync();

        var logs = new List<AuditLogDto>();
        var typeFrMap = new Dictionary<string, string>
        {
            ["Reception"] = "Réception",
            ["Issue"] = "Sortie / Distribution",
            ["Transfer"] = "Transfert",
            ["Return"] = "Retour",
            ["Adjustment"] = "Ajustement",
            ["Disposal"] = "Mise au rebut"
        };

        foreach (var m in movements)
        {
            var typeFr = typeFrMap.TryGetValue(m.Type.ToString(), out var fr) ? fr : m.Type.ToString();

            // 1. Creation log
            logs.Add(new AuditLogDto
            {
                Timestamp = m.MovementDate.AddMinutes(-5),
                User = m.CreatedByUser,
                ActionType = "Création",
                EntityType = typeFr,
                Description = $"Création du mouvement {m.MovementNumber} (Réf externe: {m.Reference ?? "—"}). Notes: {m.Notes ?? "—"}",
                Reference = m.MovementNumber
            });

            // 2. Confirmation log
            if (m.Status == Domain.Enums.StockMovementStatus.Confirmed)
            {
                logs.Add(new AuditLogDto
                {
                    Timestamp = m.MovementDate,
                    User = m.CreatedByUser,
                    ActionType = "Confirmation",
                    EntityType = typeFr,
                    Description = $"Confirmation et mise à jour du stock pour le mouvement {m.MovementNumber}.",
                    Reference = m.MovementNumber
                });
            }

            // 3. Cancellation log
            if (m.Status == Domain.Enums.StockMovementStatus.Cancelled)
            {
                logs.Add(new AuditLogDto
                {
                    Timestamp = m.MovementDate.AddMinutes(5),
                    User = m.CreatedByUser,
                    ActionType = "Annulation",
                    EntityType = typeFr,
                    Description = $"Annulation du mouvement {m.MovementNumber}.",
                    Reference = m.MovementNumber
                });
            }
        }

        // Apply filters in memory
        var result = logs.AsQueryable();
        if (!string.IsNullOrEmpty(actionType))
        {
            result = result.Where(l => l.ActionType.Equals(actionType, StringComparison.OrdinalIgnoreCase));
        }

        return Ok(result.OrderByDescending(l => l.Timestamp).ToList());
    }
}
