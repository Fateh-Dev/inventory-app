using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Modules.Stock.Application.Lots;
using Modules.Stock.Application.DTOs;
using SharedKernel;

namespace Modules.Stock.Controllers;

[ApiController]
[Route("api/stock/[controller]")]
public class LotsController : ControllerBase
{
    private readonly IMediator _mediator;
    public LotsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<StockLotDto>>> GetAll(
        [FromQuery] Guid? stockItemId,
        [FromQuery] Guid? warehouseId,
        [FromQuery] bool? expiringOnly,
        [FromQuery] bool? lowStockOnly,
        [FromQuery] bool? excludeExpired,
        [FromQuery] int? pageNumber,
        [FromQuery] int? pageSize)
    {
        var result = await _mediator.Send(new GetAllLotsQuery(stockItemId, warehouseId, expiringOnly, lowStockOnly, excludeExpired, pageNumber, pageSize));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }
}
