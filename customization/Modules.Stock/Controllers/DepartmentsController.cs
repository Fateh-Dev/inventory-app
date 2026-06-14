using MediatR;
using Microsoft.AspNetCore.Mvc;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Application.ReferenceData.Queries;
using SharedKernel;

namespace Modules.Stock.Controllers;

[ApiController]
[Route("api/stock/[controller]")]
public class DepartmentsController : ControllerBase
{
    private readonly IMediator _mediator;
    public DepartmentsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DepartmentDto>>> GetAll([FromQuery] bool activeOnly = true)
    {
        var result = await _mediator.Send(new GetAllDepartmentsQuery(activeOnly));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost]
    public async Task<ActionResult<DepartmentDto>> Create([FromBody] CreateDepartmentCommand command)
    {
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<DepartmentDto>> Update(Guid id, [FromBody] UpdateDepartmentCommand command)
    {
        if (id != command.Id) return BadRequest();
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var result = await _mediator.Send(new DeleteDepartmentCommand(id));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }
}
