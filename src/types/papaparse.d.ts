declare module 'papaparse' {
  export interface ParseResult<T> {
    data: T;
    errors: any[];
    meta: any;
  }

  export interface ParseConfig {
    delimiter?: string;
    newline?: string;
    skipEmptyLines?: boolean;
  }

  export interface UnparseConfig {
    delimiter?: string;
    newline?: string;
    quotes?: boolean;
    quoteChar?: string;
    escapeChar?: string;
  }

  export function parse<T = any>(input: string, config?: ParseConfig): ParseResult<T>;
  export function unparse(data: any[][], config?: UnparseConfig): string;
}
