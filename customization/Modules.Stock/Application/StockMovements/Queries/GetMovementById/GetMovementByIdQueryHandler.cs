using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Infrastructure.Persistence;
using SharedKernel;

namespace Modules.Stock.Application.StockMovements.Queries.GetMovementById;

public class GetMovementByIdQueryHandler : IRequestHandler<GetMovementByIdQuery, Result<StockMovementDto>>
{
    private readonly StockDbContext _context;

    public GetMovementByIdQueryHandler(StockDbContext context)
    {
        _context = context;
    }

    public async Task<Result<StockMovementDto>> Handle(GetMovementByIdQuery request, CancellationToken cancellationToken)
    {
        var movement = await _context.StockMovements
            .Include(m => m.Lines)
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken);

        if (movement == null)
            return Result<StockMovementDto>.Failure(Error.NotFound("Movement.NotFound", $"Movement with ID {request.Id} was not found."));

        var sourceWh = movement.SourceWarehouseId.HasValue ? await _context.Warehouses.FindAsync(movement.SourceWarehouseId.Value) : null;
        var destWh = movement.DestinationWarehouseId.HasValue ? await _context.Warehouses.FindAsync(movement.DestinationWarehouseId.Value) : null;
        var supplier = movement.SupplierId.HasValue ? await _context.Suppliers.FindAsync(movement.SupplierId.Value) : null;
        var department = movement.DepartmentId.HasValue ? await _context.Departments.FindAsync(movement.DepartmentId.Value) : null;

        var dto = new StockMovementDto
        {
            Id = movement.Id,
            MovementNumber = movement.MovementNumber,
            Type = movement.Type.ToString(),
            TypeId = (int)movement.Type,
            Status = movement.Status.ToString(),
            StatusId = (int)movement.Status,
            SourceWarehouseId = movement.SourceWarehouseId,
            SourceWarehouseName = sourceWh?.Name,
            DestinationWarehouseId = movement.DestinationWarehouseId,
            DestinationWarehouseName = destWh?.Name,
            SupplierId = movement.SupplierId,
            SupplierName = supplier?.Name,
            DepartmentId = movement.DepartmentId,
            DepartmentName = department?.Name,
            Reference = movement.Reference,
            MovementDate = movement.MovementDate,
            Notes = movement.Notes,
            CreatedByUser = movement.CreatedByUser,
            Lines = movement.Lines.Select(l => new StockMovementLineDto
            {
                Id = l.Id,
                StockItemId = l.StockItemId,
                StockLotId = l.StockLotId,
                Quantity = l.Quantity.Value,
                Unit = l.Quantity.Unit.ToString(),
                UnitCost = l.UnitCost.Amount,
                Currency = l.UnitCost.Currency,
                LineTotal = l.Quantity.Value * l.UnitCost.Amount
            }).ToList(),
            TotalValue = movement.Lines.Sum(l => l.Quantity.Value * l.UnitCost.Amount)
        };

        return Result<StockMovementDto>.Success(dto);
    }
}
