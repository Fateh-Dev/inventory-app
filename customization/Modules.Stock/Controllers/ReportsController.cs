using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Modules.Stock.Application.Reports;
using SharedKernel;

namespace Modules.Stock.Controllers;

[ApiController]
[Route("api/stock/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IMediator _mediator;
    public ReportsController(IMediator mediator) => _mediator = mediator;

    [HttpGet("consumption")]
    public async Task<ActionResult<IEnumerable<ConsumptionReportDto>>> GetConsumption(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] Guid? departmentId,
        [FromQuery] Guid? warehouseId)
    {
        var result = await _mediator.Send(new GetConsumptionReportQuery(fromDate, toDate, departmentId, warehouseId));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("valuation")]
    public async Task<ActionResult<IEnumerable<ValuationReportDto>>> GetValuation([FromQuery] Guid? warehouseId)
    {
        var result = await _mediator.Send(new GetValuationReportQuery(warehouseId));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("movements-summary")]
    public async Task<ActionResult<IEnumerable<MovementSummaryDto>>> GetMovementSummary(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate)
    {
        var result = await _mediator.Send(new GetMovementSummaryQuery(fromDate, toDate));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("top-items")]
    public async Task<ActionResult<IEnumerable<TopItemDto>>> GetTopItems(
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int top = 10)
    {
        var result = await _mediator.Send(new GetTopItemsQuery(fromDate, toDate, top));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }
}
