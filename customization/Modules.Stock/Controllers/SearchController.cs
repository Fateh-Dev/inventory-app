using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Infrastructure.Persistence;

namespace Modules.Stock.Controllers;

public class SearchResultDto
{
    public string Type { get; set; } = string.Empty; // "item" | "movement" | "supplier" | "warehouse"
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
}

[ApiController]
[Route("api/stock/[controller]")]
public class SearchController : ControllerBase
{
    private readonly StockDbContext _context;

    public SearchController(StockDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SearchResultDto>>> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return Ok(Enumerable.Empty<SearchResultDto>());
        }

        var term = q.ToLower().Trim();
        var results = new List<SearchResultDto>();

        // 1. Search StockItems
        var items = await _context.StockItems.AsNoTracking()
            .Where(i => i.Name.ToLower().Contains(term) || i.Reference.ToLower().Contains(term))
            .Take(10)
            .ToListAsync();

        results.AddRange(items.Select(i => new SearchResultDto
        {
            Type = "item",
            Id = i.Id.ToString(),
            Title = i.Name,
            Subtitle = $"Article · Réf: {i.Reference}"
        }));

        // 2. Search StockMovements
        var movements = await _context.StockMovements.AsNoTracking()
            .Where(m => m.MovementNumber.ToLower().Contains(term) || (m.Reference != null && m.Reference.ToLower().Contains(term)))
            .Take(10)
            .ToListAsync();

        var typeFrMap = new Dictionary<string, string>
        {
            ["Reception"] = "Réception",
            ["Issue"] = "Sortie",
            ["Transfer"] = "Transfert",
            ["Return"] = "Retour",
            ["Adjustment"] = "Ajustement",
            ["Disposal"] = "Mise au rebut"
        };

        results.AddRange(movements.Select(m => new SearchResultDto
        {
            Type = "movement",
            Id = m.Id.ToString(),
            Title = m.MovementNumber,
            Subtitle = $"Mouvement · Type: {(typeFrMap.TryGetValue(m.Type.ToString(), out var fr) ? fr : m.Type.ToString())}"
        }));

        // 3. Search Suppliers
        var suppliers = await _context.Suppliers.AsNoTracking()
            .Where(s => s.Name.ToLower().Contains(term) || (s.ContactPerson != null && s.ContactPerson.ToLower().Contains(term)))
            .Take(5)
            .ToListAsync();

        results.AddRange(suppliers.Select(s => new SearchResultDto
        {
            Type = "supplier",
            Id = s.Id.ToString(),
            Title = s.Name,
            Subtitle = $"Fournisseur · Contact: {s.ContactPerson}"
        }));

        // 4. Search Warehouses
        var warehouses = await _context.Warehouses.AsNoTracking()
            .Where(w => w.Name.ToLower().Contains(term) || w.Code.ToLower().Contains(term))
            .Take(5)
            .ToListAsync();

        results.AddRange(warehouses.Select(w => new SearchResultDto
        {
            Type = "warehouse",
            Id = w.Id.ToString(),
            Title = w.Name,
            Subtitle = $"Entrepôt · Code: {w.Code}"
        }));

        return Ok(results.Take(25).ToList());
    }
}
