using System;
using MediatR;
using SharedKernel;

namespace Modules.Stock.Application.Suppliers.Commands.DeactivateSupplier;

public record DeactivateSupplierCommand(Guid Id) : IRequest<Result>;
