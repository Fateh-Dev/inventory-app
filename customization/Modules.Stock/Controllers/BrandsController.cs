using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Modules.Stock.Application.ReferenceData.Queries;
using Modules.Stock.Application.DTOs;
using SharedKernel;

namespace Modules.Stock.Controllers;

[ApiController]
[Route("api/stock/[controller]")]
public class BrandsController : ControllerBase
{
    private readonly IMediator _mediator;
    public BrandsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<BrandDto>>> GetAll([FromQuery] bool? activeOnly)
    {
        var result = await _mediator.Send(new GetAllBrandsQuery(activeOnly));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost]
    public async Task<ActionResult<BrandDto>> Create(CreateBrandCommand command)
    {
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<BrandDto>> Update(Guid id, UpdateBrandCommand command)
    {
        if (id != command.Id) return BadRequest();
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteBrand(Guid id)
    {
        var result = await _mediator.Send(new DeleteBrandCommand(id));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    [HttpGet("models")]
    public async Task<ActionResult<IEnumerable<BrandModelDto>>> GetModels([FromQuery] Guid? brandId)
    {
        var result = await _mediator.Send(new GetModelsByBrandQuery(brandId));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("models")]
    public async Task<ActionResult<BrandModelDto>> CreateModel(CreateModelCommand command)
    {
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPut("models/{id}")]
    public async Task<ActionResult<BrandModelDto>> UpdateModel(Guid id, UpdateModelCommand command)
    {
        if (id != command.Id) return BadRequest();
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpDelete("models/{id}")]
    public async Task<ActionResult> DeleteModel(Guid id)
    {
        var result = await _mediator.Send(new DeleteModelCommand(id));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }
}
