import type { Extension, ExtensionMetadata } from "./schema";

class ExtensionRegistry {
  private extensions = new Map<string, Extension>();

  register<TConfig = unknown>(extension: Extension<TConfig>): void {
    this.extensions.set(extension.id, extension as Extension);
  }

  get(id: string): Extension | undefined {
    return this.extensions.get(id);
  }

  getAll(): Extension[] {
    return Array.from(this.extensions.values());
  }

  getAllMetadata(): Array<ExtensionMetadata & { id: string }> {
    return Array.from(this.extensions.values()).map((ext) => ({
      ...ext.metadata,
      id: ext.id,
    }));
  }

  getHandler(id: string) {
    const extension = this.extensions.get(id);
    if (!extension) {
      throw new Error(`Extension ${id} not found`);
    }
    return extension.handler;
  }

  validateConfig(id: string, config: unknown) {
    const extension = this.extensions.get(id);
    if (!extension) {
      throw new Error(`Extension ${id} not found`);
    }
    return extension.configSchema.parse(config);
  }
}

export const extensionRegistry = new ExtensionRegistry();

