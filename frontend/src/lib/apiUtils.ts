import type { ApiResponse } from '../api/types'

export function unwrapApiData<T>(res: { data: ApiResponse<T> }): T {
  return res.data.data
}
