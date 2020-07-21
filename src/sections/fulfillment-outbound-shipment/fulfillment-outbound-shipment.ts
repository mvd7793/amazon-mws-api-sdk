import { ParsingError } from '../../error'
import { HttpClient, RequestMeta, Resource } from '../../http'
import { NextToken } from '../../parsing'
import { getServiceStatusByResource } from '../shared'
import {
  CreateFulfillmentOrderResponse,
  GetFulfillmentOrder,
  GetFulfillmentOrderResponse,
  GetFulfillmentPreview,
  GetFulfillmentPreviewResponse,
  GetPackageTrackingDetails,
  GetPackageTrackingDetailsResponse,
  ListAllFulfillmentOrders,
  ListAllFulfillmentOrdersByNextTokenResponse,
  ListAllFulfillmentOrdersResponse,
  UpdateFulfillmentOrderResponse,
} from './codec'
import {
  canonicalizeCreateFulfillmentOrderParameters,
  canonicalizeGetFulfillmentPreviewParameters,
  canonicalizeUpdateFulfillmentOrderParameters,
  CreateFulfillmentOrderParameters,
  GetFulfillmentOrderParameters,
  GetFulfillmentPreviewParameters,
  GetPackageTrackingDetailsParameters,
  ListAllFulfillmentOrdersParameters,
  UpdateFulfillmentOrderParameters,
} from './type'

const FOS_API_VERSION = '2010-10-01'

export class FulfillmentOutboundShipment {
  constructor(private httpClient: HttpClient) {}

  async getPackageTrackingDetails(
    parameters: GetPackageTrackingDetailsParameters,
  ): Promise<[GetPackageTrackingDetails, RequestMeta]> {
    const [response, meta] = await this.httpClient.request('POST', {
      resource: Resource.FulfillmentOutboundShipment,
      version: FOS_API_VERSION,
      action: 'GetPackageTrackingDetails',
      parameters: {
        PackageNumber: parameters.PackageNumber,
      },
    })

    return GetPackageTrackingDetailsResponse.decode(response).caseOf({
      Right: (x) => [x.GetPackageTrackingDetailsResponse.GetPackageTrackingDetailsResult, meta],
      Left: (error) => {
        throw new ParsingError(error)
      },
    })
  }

  async listAllFulfillmentOrdersByNextToken(
    nextToken: NextToken<'ListAllFulfillmentOrders'>,
  ): Promise<[ListAllFulfillmentOrders, RequestMeta]> {
    const [response, meta] = await this.httpClient.request('POST', {
      resource: Resource.FulfillmentOutboundShipment,
      version: FOS_API_VERSION,
      action: 'ListAllFulfillmentOrdersByNextToken',
      parameters: {
        NextToken: nextToken.token,
      },
    })

    return ListAllFulfillmentOrdersByNextTokenResponse.decode(response).caseOf({
      Right: (x) => [
        x.ListAllFulfillmentOrdersByNextTokenResponse.ListAllFulfillmentOrdersByNextTokenResult,
        meta,
      ],
      Left: (error) => {
        throw new ParsingError(error)
      },
    })
  }

  async getFulfillmentOrder(
    parameters: GetFulfillmentOrderParameters,
  ): Promise<[GetFulfillmentOrder, RequestMeta]> {
    const [response, meta] = await this.httpClient.request('POST', {
      resource: Resource.FulfillmentOutboundShipment,
      version: FOS_API_VERSION,
      action: 'GetFulfillmentOrder',
      parameters: {
        SellerFulfillmentOrderId: parameters.SellerFulfillmentOrderId,
      },
    })

    return GetFulfillmentOrderResponse.decode(response).caseOf({
      Right: (x) => [x.GetFulfillmentOrderResponse.GetFulfillmentOrderResult, meta],
      Left: (error) => {
        throw new ParsingError(error)
      },
    })
  }

  async listAllFulfillmentOrders(
    parameters: ListAllFulfillmentOrdersParameters = {},
  ): Promise<[ListAllFulfillmentOrders, RequestMeta]> {
    const [response, meta] = await this.httpClient.request('POST', {
      resource: Resource.FulfillmentOutboundShipment,
      version: FOS_API_VERSION,
      action: 'ListAllFulfillmentOrders',
      parameters: {
        QueryStartDateTime: parameters.QueryStartDateTime?.toISOString(),
      },
    })

    return ListAllFulfillmentOrdersResponse.decode(response).caseOf({
      Right: (x) => [x.ListAllFulfillmentOrdersResponse.ListAllFulfillmentOrdersResult, meta],
      Left: (error) => {
        throw new ParsingError(error)
      },
    })
  }

  async updateFulfillmentOrder(
    parameters: UpdateFulfillmentOrderParameters,
  ): Promise<['', RequestMeta]> {
    const [response, meta] = await this.httpClient.request('POST', {
      resource: Resource.FulfillmentOutboundShipment,
      version: FOS_API_VERSION,
      action: 'UpdateFulfillmentOrder',
      parameters: canonicalizeUpdateFulfillmentOrderParameters(parameters),
    })

    return UpdateFulfillmentOrderResponse.decode(response).caseOf({
      Right: () => ['', meta],
      Left: (error) => {
        throw new ParsingError(error)
      },
    })
  }

  async createFulfillmentOrder(
    parameters: CreateFulfillmentOrderParameters,
  ): Promise<['', RequestMeta]> {
    const [response, meta] = await this.httpClient.request('POST', {
      resource: Resource.FulfillmentOutboundShipment,
      version: FOS_API_VERSION,
      action: 'CreateFulfillmentOrder',
      parameters: canonicalizeCreateFulfillmentOrderParameters(parameters),
    })

    return CreateFulfillmentOrderResponse.decode(response).caseOf({
      Right: () => ['', meta],
      Left: (error) => {
        throw new ParsingError(error)
      },
    })
  }

  async getFulfillmentPreview(
    parameters: GetFulfillmentPreviewParameters,
  ): Promise<[GetFulfillmentPreview, RequestMeta]> {
    const [response, meta] = await this.httpClient.request('POST', {
      resource: Resource.FulfillmentOutboundShipment,
      version: FOS_API_VERSION,
      action: 'GetFulfillmentPreview',
      parameters: canonicalizeGetFulfillmentPreviewParameters(parameters),
    })

    return GetFulfillmentPreviewResponse.decode(response).caseOf({
      Right: (x) => [x.GetFulfillmentPreviewResponse.GetFulfillmentPreviewResult, meta],
      Left: (error) => {
        throw new ParsingError(error)
      },
    })
  }

  async getServiceStatus() {
    return getServiceStatusByResource(
      this.httpClient,
      Resource.FulfillmentOutboundShipment,
      FOS_API_VERSION,
    )
  }
}
