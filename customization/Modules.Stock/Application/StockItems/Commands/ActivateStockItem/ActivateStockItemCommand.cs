using System;
using MediatR;
using SharedKernel;

namespace Modules.Stock.Application.StockItems.Commands.ActivateStockItem;

public record ActivateStockItemCommand(Guid Id) : IRequest<Result>;
