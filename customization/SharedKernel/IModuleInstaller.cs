using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace SharedKernel;

public interface IModuleInstaller
{
    void Install(IServiceCollection services, IConfiguration configuration);
}
