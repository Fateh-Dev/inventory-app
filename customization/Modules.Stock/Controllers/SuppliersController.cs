using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Modules.Stock.Application.Suppliers.Commands.ActivateSupplier;
using Modules.Stock.Application.Suppliers.Commands.CreateSupplier;
using Modules.Stock.Application.Suppliers.Commands.DeactivateSupplier;
using Modules.Stock.Application.Suppliers.Commands.UpdateSupplier;
using Modules.Stock.Application.Suppliers.Queries.GetAllSuppliers;
using Modules.Stock.Application.Suppliers.Queries.GetSupplierById;

namespace Modules.Stock.Controllers;

[ApiController]
[Route("api/stock/[controller]")]
public class SuppliersController : ControllerBase
{
    private readonly IMediator _mediator;

    public SuppliersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSupplierCommand command)
    {
        var result = await _mediator.Send(command);
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok(result.Value);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSupplierCommand command)
    {
        if (id != command.Id) return BadRequest("ID mismatch");
        var result = await _mediator.Send(command);
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok(result.Value);
    }

    [HttpPost("{id}/deactivate")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var result = await _mediator.Send(new DeactivateSupplierCommand(id));
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok();
    }

    [HttpPost("{id}/activate")]
    public async Task<IActionResult> Activate(Guid id)
    {
        var result = await _mediator.Send(new ActivateSupplierCommand(id));
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok();
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? activeOnly)
    {
        var result = await _mediator.Send(new GetAllSuppliersQuery(activeOnly));
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok(result.Value);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _mediator.Send(new GetSupplierByIdQuery(id));
        if (!result.IsSuccess) return NotFound(result.Error);
        return Ok(result.Value);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        // Soft delete via deactivate — preserves FK integrity
        var result = await _mediator.Send(new DeactivateSupplierCommand(id));
        if (!result.IsSuccess) return BadRequest(result.Error);
        return NoContent();
    }
}
