import {
  boolean,
  Codec,
  exactly,
  GetInterface,
  number,
  oneOf,
  optional,
  string,
} from 'purify-ts/Codec'

import { ParsingError } from '../error'
import { HttpClient, RequestMeta, Resource } from '../http'
import {
  ensureArray,
  ensureString,
  mwsDate,
  NextToken,
  nextToken as nextTokenCodec,
} from '../parsing'
import { getServiceStatusByResource } from './shared'
import { FulfillmentChannelEnum, RequireOnlyOne } from './types'

const ORDERS_API_VERSION = '2013-09-01'

export enum OrderStatusEnum {
  PendingAvailability = 'PendingAvailability',
  Pending = 'Pending',
  Unshipped = 'Unshipped',
  PartiallyShipped = 'PartiallyShipped',
  Shipped = 'Shipped',
  Canceled = 'Canceled',
  Unfulfillable = 'Unfulfillable',
}

export enum PaymentMethodEnum {
  COD = 'COD',
  CVS = 'CVS',
  Other = 'Other',
}

export enum AddressType {
  Commercial = 'Commercial',
  Residential = 'Residential',
}

export enum EasyShipShipmentStatusEnum {
  PendingPickUp = 'PendingPickUp',
  LabelCanceled = 'LabelCanceled',
  PickedUp = 'PickedUp',
  OutForDelivery = 'OutForDelivery',
  Damaged = 'Damaged',
  Delivered = 'Delivered',
  RejectedByBuyer = 'RejectedByBuyer',
  Undeliverable = 'Undeliverable',
  ReturnedToSeller = 'ReturnedToSeller',
  ReturningToSller = 'ReturningToSller',
  Lost = 'Lost',
}

export enum Condition {
  New = 'New',
  Used = 'Used',
  Collectible = 'Collectible',
  Refurbished = 'Refurbished',
  Preorder = 'Preorder',
  Club = 'Club',
}

export enum ConditionSubtype {
  New = 'New',
  Mint = 'Mint',
  VeryGood = 'Very Good',
  Good = 'Good',
  Acceptable = 'Acceptable',
  Poor = 'Poor',
  Club = 'Club',
  OEM = 'OEM',
  Warranty = 'Warranty',
  RefurbishedWarranty = 'Refurbished Warranty',
  Refurbished = 'Refurbished',
  OpenBox = 'Open Box',
  Any = 'Any',
  Other = 'Other',
}

const orderStatus: Codec<OrderStatusEnum> = oneOf(
  Object.values(OrderStatusEnum).map((x) => exactly(x)),
)
const fulfillmentChannel: Codec<FulfillmentChannelEnum> = oneOf(
  Object.values(FulfillmentChannelEnum).map((x) => exactly(x)),
)
const adddressType: Codec<AddressType> = oneOf(Object.values(AddressType).map((x) => exactly(x)))
const condition: Codec<Condition> = oneOf(Object.values(Condition).map((x) => exactly(x)))
const conditionSubtype: Codec<ConditionSubtype> = oneOf(
  Object.values(ConditionSubtype).map((x) => exactly(x)),
)

const Address = Codec.interface({
  Name: string,
  AddressLine1: optional(string),
  AddressLine2: optional(string),
  AddressLine3: optional(string),
  City: optional(string),
  Municipality: optional(string),
  Country: optional(string),
  District: optional(string),
  StateOrRegion: optional(string),
  PostalCode: optional(ensureString),
  CountryCode: optional(string),
  Phone: optional(string),
  AddressType: optional(adddressType),
})

const TaxClassification = Codec.interface({
  Name: string,
  Value: string,
})

const BuyerTaxInfo = Codec.interface({
  CompanyLegalName: optional(string),
  TaxingRegion: optional(string),
  TaxClassifications: optional(
    Codec.interface({
      TaxClassification,
    }),
  ),
})

const Money = Codec.interface({
  CurrencyCode: optional(string),
  Amount: optional(number),
})

export const Order = Codec.interface({
  AmazonOrderId: string,
  SellerOrderId: optional(string),
  PurchaseDate: mwsDate,
  LastUpdateDate: mwsDate,
  OrderStatus: orderStatus,
  FulfillmentChannel: optional(fulfillmentChannel),
  SalesChannel: optional(string),
  ShipServiceLevel: optional(string),
  ShippingAddress: optional(Address),
  OrderTotal: optional(Money),
  NumberOfItemsShipped: optional(number),
  NumberOfItemsUnshipped: optional(number),
  PaymentExecutionDetail: optional(
    ensureArray(
      'PaymentExecutionDetailItem',
      Codec.interface({
        Payment: Money,
        PaymentMethod: string,
      }),
    ),
  ),
  PaymentMethod: optional(string),
  PaymentMethodDetails: ensureArray('PaymentMethodDetail', string),
  IsReplacementOrder: optional(boolean),
  ReplacedOrderId: optional(string),
  MarketplaceId: optional(string),
  BuyerEmail: optional(string),
  BuyerName: optional(string),
  BuyerCounty: optional(string),
  BuyerTaxInfo: optional(BuyerTaxInfo),
  ShipmentServiceLevelCategory: optional(string),
  EasyShipShipmentStatus: optional(string),
  OrderType: optional(string),
  EarliestShipDate: optional(mwsDate),
  LatestShipDate: optional(mwsDate),
  EarliestDeliveryDate: optional(mwsDate),
  LatestDeliveryDate: optional(mwsDate),
  IsBusinessOrder: optional(boolean),
  IsSoldByAB: optional(boolean),
  PurchaseOrderNumber: optional(string),
  IsPrime: optional(boolean),
  IsPremiumOrder: optional(boolean),
  IsGlobalExpressEnabled: optional(boolean),
  PromiseResponseDueDate: optional(mwsDate),
  IsEstimatedShipDateSet: optional(boolean),
})

export const ListOrders = Codec.interface({
  NextToken: optional(nextTokenCodec('ListOrders')),
  LastUpdatedBefore: optional(mwsDate),
  CreatedBefore: optional(mwsDate),
  Orders: ensureArray('Order', Order),
})

const ListOrdersResponse = Codec.interface({
  ListOrdersResponse: Codec.interface({
    ListOrdersResult: ListOrders,
  }),
})

const ListOrdersByNextTokenResponse = Codec.interface({
  ListOrdersByNextTokenResponse: Codec.interface({
    ListOrdersByNextTokenResult: ListOrders,
  }),
})

const GetOrderResponse = Codec.interface({
  GetOrderResponse: Codec.interface({
    GetOrderResult: Codec.interface({
      Orders: ensureArray('Order', Order),
    }),
  }),
})

export const ListOrderItems = Codec.interface({
  NextToken: optional(string),
  AmazonOrderId: string,
  OrderItems: ensureArray(
    'OrderItem',
    Codec.interface({
      ASIN: string,
      OrderItemId: ensureString,
      SellerSKU: optional(string),
      BuyerCustomizedInfo: optional(
        Codec.interface({
          CustomizedURL: string,
        }),
      ),
      Title: optional(string),
      QuantityOrdered: number,
      QuantityShipper: optional(number),
      PointsGranted: optional(
        Codec.interface({
          PointsNumber: optional(number),
          PointsMonetaryValue: optional(Money),
        }),
      ),
      ProductInfo: optional(
        Codec.interface({
          NumberOfItems: optional(number),
        }),
      ),
      ItemPrice: optional(Money),
      ShippingPrice: optional(Money),
      GiftWrapPrice: optional(Money),
      TaxCollection: optional(
        Codec.interface({
          Model: string,
          ResponsibleParty: string,
        }),
      ),
      ItemTax: optional(Money),
      ShippingTax: optional(Money),
      GiftWrapTax: optional(Money),
      ShippingDiscount: optional(Money),
      ShippingDiscountTax: optional(Money),
      PromotionDiscount: optional(Money),
      PromotionDiscountTax: optional(Money),
      PromotionIds: optional(ensureArray('PromotionId', string)),
      CODFee: optional(Money),
      CODFeeDiscount: optional(Money),
      IsGift: optional(boolean),
      GiftMessageText: optional(string),
      GiftWrapLevel: optional(string),
      ConditionNote: optional(string),
      ConditionId: optional(condition),
      ConditionSubtypeId: optional(conditionSubtype),
      ScheduledDeliveryStartDate: optional(mwsDate),
      ScheduledDeliveryEndDate: optional(mwsDate),
      PriceDesignation: optional(string),
      IsTransparency: optional(boolean),
      SerialNumberRequired: optional(boolean),
    }),
  ),
})

const ListOrderItemsResponse = Codec.interface({
  ListOrderItemsResponse: Codec.interface({
    ListOrderItemsResult: ListOrderItems,
  }),
})

const ListOrderItemsByNextTokenResponse = Codec.interface({
  ListOrderItemsByNextTokenResponse: Codec.interface({
    ListOrderItemsByNextTokenResult: ListOrderItems,
  }),
})

export type Order = GetInterface<typeof Order>
export type ListOrders = GetInterface<typeof ListOrders>
export type ListOrderItems = GetInterface<typeof ListOrderItems>

export interface GetOrderParameters {
  AmazonOrderId: string[]
}

export type FulfillmentChannel = (keyof typeof FulfillmentChannelEnum)[]
export type PaymentMethod = (keyof typeof PaymentMethodEnum)[]
export type OrderStatus = (keyof typeof OrderStatusEnum)[]
export type EasyShipShipmentStatus = (keyof typeof EasyShipShipmentStatusEnum)[]

export type ListOrderParameters = RequireOnlyOne<
  {
    CreatedAfter?: Date
    CreatedBefore?: Date
    LastUpdatedAfter?: Date
    LastUpdatedBefore?: Date
    OrderStatus?: OrderStatus
    MarketplaceId: string[]
    FulfillmentChannel?: FulfillmentChannel
    PaymentMethod?: PaymentMethod
    BuyerEmail?: string
    SellerOrderId?: string
    MaxResultsPerPage?: number
    EasyShipShipmentStatus?: EasyShipShipmentStatus
  },
  'CreatedAfter' | 'LastUpdatedAfter'
>

export interface ListOrderItemsParameters {
  AmazonOrderId: string
}

const canonicalizeParameters = (parameters: ListOrderParameters) => {
  return {
    CreatedAfter: parameters.CreatedAfter?.toISOString(),
    CreatedBefore: parameters.CreatedBefore?.toISOString(),
    LastUpdatedAfter: parameters.LastUpdatedAfter?.toISOString(),
    LastUpdatedBefore: parameters.LastUpdatedBefore?.toISOString(),
    'OrderStatus.Status': parameters.OrderStatus,
    'MarketplaceId.Id': parameters.MarketplaceId,
    'FulfillmentChannel.Channel': parameters.FulfillmentChannel,
    'PaymentMethod.Method': parameters.PaymentMethod,
    'EasyShipShipmentStatus.Status': parameters.EasyShipShipmentStatus,
    BuyerEmail: parameters.BuyerEmail,
    SellerOrderId: parameters.SellerOrderId,
    MaxResultsPerPage: parameters.MaxResultsPerPage,
  }
}

export class Orders {
  constructor(private httpClient: HttpClient) {}

  async listOrders(parameters: ListOrderParameters): Promise<[ListOrders, RequestMeta]> {
    const [response, meta] = await this.httpClient.request('POST', {
      resource: Resource.Orders,
      version: ORDERS_API_VERSION,
      action: 'ListOrders',
      parameters: canonicalizeParameters(parameters),
    })

    return ListOrdersResponse.decode(response).caseOf({
      Right: (x) => [x.ListOrdersResponse.ListOrdersResult, meta],
      Left: (error) => {
        throw new ParsingError(error)
      },
    })
  }

  async listOrdersByNextToken(
    nextToken: NextToken<'ListOrders'>,
  ): Promise<[ListOrders, RequestMeta]> {
    const [response, meta] = await this.httpClient.request('POST', {
      resource: Resource.Orders,
      version: ORDERS_API_VERSION,
      action: 'ListOrdersByNextToken',
      parameters: {
        NextToken: nextToken.token,
      },
    })

    return ListOrdersByNextTokenResponse.decode(response).caseOf({
      Right: (x) => [x.ListOrdersByNextTokenResponse.ListOrdersByNextTokenResult, meta],
      Left: (error) => {
        throw new ParsingError(error)
      },
    })
  }

  async getOrder(parameters: GetOrderParameters): Promise<[Order[], RequestMeta]> {
    const [response, meta] = await this.httpClient.request('POST', {
      resource: Resource.Orders,
      version: ORDERS_API_VERSION,
      action: 'GetOrder',
      parameters: {
        'AmazonOrderId.Id': parameters.AmazonOrderId,
      },
    })

    return GetOrderResponse.decode(response).caseOf({
      Right: (x) => [x.GetOrderResponse.GetOrderResult.Orders, meta],
      Left: (error) => {
        throw new ParsingError(error)
      },
    })
  }

  async listOrderItems(
    parameters: ListOrderItemsParameters,
  ): Promise<[ListOrderItems, RequestMeta]> {
    const [response, meta] = await this.httpClient.request('POST', {
      resource: Resource.Orders,
      version: ORDERS_API_VERSION,
      action: 'ListOrderItems',
      parameters: {
        AmazonOrderId: parameters.AmazonOrderId,
      },
    })

    return ListOrderItemsResponse.decode(response).caseOf({
      Right: (x) => [x.ListOrderItemsResponse.ListOrderItemsResult, meta],
      Left: (error) => {
        throw new ParsingError(error)
      },
    })
  }

  async listOrderItemsByNextToken(
    nextToken: NextToken<'ListOrderItems'>,
  ): Promise<[ListOrderItems, RequestMeta]> {
    const [response, meta] = await this.httpClient.request('POST', {
      resource: Resource.Orders,
      version: ORDERS_API_VERSION,
      action: 'ListOrderItemsByNextToken',
      parameters: { NextToken: nextToken.token },
    })

    return ListOrderItemsByNextTokenResponse.decode(response).caseOf({
      Right: (x) => [x.ListOrderItemsByNextTokenResponse.ListOrderItemsByNextTokenResult, meta],
      Left: (error) => {
        throw new ParsingError(error)
      },
    })
  }

  async getServiceStatus() {
    return getServiceStatusByResource(this.httpClient, Resource.Orders, ORDERS_API_VERSION)
  }
}
