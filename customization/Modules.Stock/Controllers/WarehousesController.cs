using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Modules.Stock.Application.Warehouses.Commands.ActivateWarehouse;
using Modules.Stock.Application.Warehouses.Commands.CreateWarehouse;
using Modules.Stock.Application.Warehouses.Commands.DeactivateWarehouse;
using Modules.Stock.Application.Warehouses.Commands.UpdateWarehouse;
using Modules.Stock.Application.Warehouses.Queries.GetAllWarehouses;
using Modules.Stock.Application.Warehouses.Queries.GetWarehouseById;
using Modules.Stock.Application.Warehouses.Queries.GetWarehouseStock;

namespace Modules.Stock.Controllers;

[ApiController]
[Route("api/stock/[controller]")]
public class WarehousesController : ControllerBase
{
    private readonly IMediator _mediator;

    public WarehousesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWarehouseCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok(result.Value);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateWarehouseCommand command)
    {
        if (id != command.Id) return BadRequest("ID mismatch");
        var result = await _mediator.Send(command);
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok(result.Value);
    }

    [HttpPost("{id}/deactivate")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var result = await _mediator.Send(new DeactivateWarehouseCommand(id));
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok();
    }

    [HttpPost("{id}/activate")]
    public async Task<IActionResult> Activate(Guid id)
    {
        var result = await _mediator.Send(new ActivateWarehouseCommand(id));
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok();
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? activeOnly)
    {
        var result = await _mediator.Send(new GetAllWarehousesQuery(activeOnly));
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok(result.Value);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _mediator.Send(new GetWarehouseByIdQuery(id));
        if (!result.IsSuccess) return NotFound(result.Error);
        return Ok(result.Value);
    }

    [HttpGet("{id}/stock")]
    public async Task<IActionResult> GetStock(Guid id)
    {
        var result = await _mediator.Send(new GetWarehouseStockQuery(id));
        if (!result.IsSuccess) return NotFound(result.Error);
        return Ok(result.Value);
    }
}
