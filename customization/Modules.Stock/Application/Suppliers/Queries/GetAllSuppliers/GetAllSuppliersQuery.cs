using System.Collections.Generic;
using MediatR;
using Modules.Stock.Application.DTOs;
using SharedKernel;

namespace Modules.Stock.Application.Suppliers.Queries.GetAllSuppliers;

public record GetAllSuppliersQuery(bool? ActiveOnly = null) : IRequest<Result<IEnumerable<SupplierDto>>>;
