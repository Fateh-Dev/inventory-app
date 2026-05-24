using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Modules.Stock.Application.Alerts.Commands.MarkAlertRead;
using Modules.Stock.Application.Alerts.Commands.ResolveAlert;
using Modules.Stock.Application.Alerts.Queries.GetAlerts;
using Modules.Stock.Application.Alerts.Queries.GetStockSummary;

namespace Modules.Stock.Controllers;

[ApiController]
[Route("api/stock/[controller]")]
public class StockAlertsController : ControllerBase
{
    private readonly IMediator _mediator;

    public StockAlertsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAlerts(
        [FromQuery] bool? unreadOnly,
        [FromQuery] bool? unresolvedOnly,
        [FromQuery] Guid? stockItemId)
    {
        var result = await _mediator.Send(new GetAlertsQuery(unreadOnly, unresolvedOnly, stockItemId));
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok(result.Value);
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var result = await _mediator.Send(new GetStockSummaryQuery());
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok(result.Value);
    }

    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        var result = await _mediator.Send(new MarkAlertReadCommand(id));
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok();
    }

    [HttpPost("{id}/resolve")]
    public async Task<IActionResult> Resolve(Guid id, [FromBody] ResolveAlertRequest request)
    {
        var result = await _mediator.Send(new ResolveAlertCommand(id, request.Resolution));
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok();
    }
}

public class ResolveAlertRequest
{
    public string Resolution { get; set; } = string.Empty;
}
