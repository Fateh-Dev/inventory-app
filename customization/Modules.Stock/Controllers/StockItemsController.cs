using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Modules.Stock.Application.StockItems.Commands.ActivateStockItem;
using Modules.Stock.Application.StockItems.Commands.CreateStockItem;
using Modules.Stock.Application.StockItems.Commands.DeactivateStockItem;
using Modules.Stock.Application.StockItems.Commands.UpdateStockItem;
using Modules.Stock.Application.StockItems.Queries.GetAllStockItems;
using Modules.Stock.Application.StockItems.Queries.GetLotsByStockItem;
using Modules.Stock.Application.StockItems.Queries.GetStockItemById;
using Modules.Stock.Domain.Enums;

namespace Modules.Stock.Controllers;

[ApiController]
[Route("api/stock/[controller]")]
public class StockItemsController : ControllerBase
{
    private readonly IMediator _mediator;

    public StockItemsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStockItemCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok(result.Value);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateStockItemCommand command)
    {
        if (id != command.Id) return BadRequest("ID mismatch");
        var result = await _mediator.Send(command);
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok(result.Value);
    }

    [HttpPost("{id}/deactivate")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var result = await _mediator.Send(new DeactivateStockItemCommand(id));
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok();
    }

    [HttpPost("{id}/activate")]
    public async Task<IActionResult> Activate(Guid id)
    {
        var result = await _mediator.Send(new ActivateStockItemCommand(id));
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok();
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? categoryId, 
        [FromQuery] bool? activeOnly, 
        [FromQuery] bool? lowStockOnly, 
        [FromQuery] bool? hasExpiryOnly,
        [FromQuery] string? searchTerm,
        [FromQuery] int? pageNumber,
        [FromQuery] int? pageSize)
    {
        var result = await _mediator.Send(new GetAllStockItemsQuery(categoryId, activeOnly, lowStockOnly, hasExpiryOnly, searchTerm, pageNumber, pageSize));
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok(result.Value);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _mediator.Send(new GetStockItemByIdQuery(id));
        if (!result.IsSuccess) return NotFound(result.Error);
        return Ok(result.Value);
    }

    [HttpGet("{id}/lots")]
    public async Task<IActionResult> GetLots(Guid id, [FromQuery] bool? excludeExpired)
    {
        var result = await _mediator.Send(new GetLotsByStockItemQuery(id, excludeExpired));
        if (!result.IsSuccess) return NotFound(result.Error);
        return Ok(result.Value);
    }
}
