using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Modules.Stock.Application.StockMovements.Commands.CancelMovement;
using Modules.Stock.Application.StockMovements.Commands.CreateMovement;
using Modules.Stock.Application.StockMovements.Queries.GetAllMovements;
using Modules.Stock.Application.StockMovements.Queries.GetMovementById;
using Modules.Stock.Domain.Enums;

namespace Modules.Stock.Controllers;

[ApiController]
[Route("api/stock/[controller]")]
public class StockMovementsController : ControllerBase
{
    private readonly IMediator _mediator;

    public StockMovementsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMovementCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok(result.Value);
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] CancelMovementRequest request)
    {
        var result = await _mediator.Send(new CancelMovementCommand(id, request.Reason));
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok();
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] StockMovementType? type,
        [FromQuery] StockMovementStatus? status,
        [FromQuery] Guid? warehouseId,
        [FromQuery] Guid? supplierId,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] bool includeLines = false)
    {
        var result = await _mediator.Send(new GetAllMovementsQuery(type, status, warehouseId, supplierId, fromDate, toDate, includeLines));
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok(result.Value);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _mediator.Send(new GetMovementByIdQuery(id));
        if (!result.IsSuccess) return NotFound(result.Error);
        return Ok(result.Value);
    }
}

public class CancelMovementRequest
{
    public string Reason { get; set; } = string.Empty;
}
