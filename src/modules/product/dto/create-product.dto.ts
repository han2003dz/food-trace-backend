export class CreateProductDto {
  name: string

  description?: string
  image_url?: string | null

  origin?: string
  producer_name?: string
  manufacture_date?: Date
  expiry_date?: Date

  category?: string
  storage_conditions?: string
  nutritional_info?: any

  metadata_uri?: string
  metadata_hash?: string

  organization_id?: string
}
