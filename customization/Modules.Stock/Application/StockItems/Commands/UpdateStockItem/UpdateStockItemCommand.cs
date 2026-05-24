using System;
using MediatR;
using Modules.Stock.Application.DTOs;
using Modules.Stock.Domain.Enums;
using SharedKernel;

namespace Modules.Stock.Application.StockItems.Commands.UpdateStockItem;

public record UpdateStockItemCommand(
    Guid Id,
    string Name,
    string? Description,
    Guid CategoryId,
    UnitOfMeasure DefaultUnit,
    Guid? BrandId,
    Guid? BrandModelId,
    bool RequiresSerialNumber,
    bool HasExpiryDate,
    decimal DefaultLowStockThreshold,
    Guid? DefaultSupplierId
) : IRequest<Result<StockItemDto>>;
