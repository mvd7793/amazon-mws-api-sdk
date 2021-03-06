import {
  canonicalizeDate,
  canonicalizeInboundShipmentItem,
  canonicalizeInboundShipmentPlanRequestItems,
  canonicalizeParametersCreateUpdateInboundShipment,
  canonicalizeParametersCreateUpdateInboundShipmentPlan,
  canonicalizePutTransportContentParameters,
  CreateInboundShipmentParameters,
  CreateInboundShipmentPlanParameters,
  FIBDimensions,
  GetPackageLabelsParameters,
  GetUniquePackageLabelsParameters,
  InboundShipmentHeader,
  InboundShipmentItem,
  InboundShipmentPlanRequestItem,
  NextToken,
  PageType,
  PartneredSmallParcelPackageInput,
} from '../../src'
import {
  createMockHttpClient,
  mockMwsServiceStatus,
  mockParsingError,
  parsingErrorRegex,
} from '../utils'

function mockFunctions() {
  /**
   * Mock everything in purify-ts, restore it back to normal,
   *  except for `enumeration` which will be stubbed to accept
   * https://github.com/facebook/jest/issues/936#issuecomment-265074320
   */
  const original = jest.requireActual('purify-ts')

  return {
    ...original, // Pass down all the exported objects
    enumeration: <T extends Record<string, string | number>>(enumeration: T) => {
      const enumValues = Object.values(enumeration)

      return original.Codec.custom({
        decode: (input: string | number) => {
          if (typeof input !== 'string' && typeof input !== 'number') {
            return original.Left(`Expected enum, received ${input}`)
          }

          const enumIndex = enumValues.indexOf(input)

          return enumIndex !== -1 || input === 'String'
            ? original.Right((enumValues[enumIndex] as T[keyof T]) || 'String')
            : original.Left(`Expected enum, received ${input}`)
        },
        encode: original.identity,
        schema: () => ({ enum: enumValues }),
      })
    },
  }
}
jest.mock('purify-ts', () => mockFunctions())

const mockAddress = {
  Name: '',
  AddressLine1: '',
  Email: '',
  City: '',
  PostalCode: '',
  CountryCode: '',
  Phone: '',
}

const mockInboundShipmentItem = {
  SellerSKU: '',
  QuantityShipped: 1,
}

const mockInboundShipmentHeader: InboundShipmentHeader = {
  ShipmentName: '',
  ShipFromAddress: mockAddress,
  DestinationFulfillmentCenterId: '',
  LabelPrepPreference: 'SELLER_LABEL',
  ShipmentStatus: 'WORKING',
}

const mockPageType: PageType = 'PackageLabel_Letter_2'

const mockContact = {
  Name: '',
  Phone: '',
  Email: '',
  Fax: '',
}

const mockDimensions: FIBDimensions = {
  Unit: 'inches',
  Length: 1,
  Width: 1,
  Height: 1,
}

const mockPallet = {
  Dimension: mockDimensions,
  IsStacked: false,
}

describe('fulfillmentInboundShipment', () => {
  describe('parameters', () => {
    describe('canonicalizeParametersCreateUpdateInboundShipmentPlan', () => {
      it('properly canonicalizes ParametersCreateUpdateInboundShipmentPlan', () => {
        expect.assertions(1)

        const mock: CreateInboundShipmentPlanParameters = {
          ShipToCountryCode: '',
          ShipFromAddress: mockAddress,
          ShipToCountrySubdivisionCode: '',
          InboundShipmentPlanRequestItems: [],
        }

        expect(
          canonicalizeParametersCreateUpdateInboundShipmentPlan(mock)[
            'InboundShipmentPlanRequestItems.member'
          ],
        ).toStrictEqual(mock.InboundShipmentPlanRequestItems)
      })
    })

    describe('canonicalizeDate', () => {
      it('properly canonicalizes date to YYYY-MM-DD', () => {
        expect.assertions(1)

        const date = canonicalizeDate(new Date()) as string
        const dateRegex = new RegExp(/^(\d{4})([/-])(\d{1,2})\2(\d{1,2})$/)

        expect(dateRegex.test(date)).toStrictEqual(true)
      })
    })

    describe('canonicalizeInboundShipmentPlanRequestItems', () => {
      it('properly canonicalizes InboundShipmentPlanRequestItems', () => {
        expect.assertions(1)

        const mock: InboundShipmentPlanRequestItem = {
          SellerSKU: '',
          ASIN: '',
          Quantity: 1,
          QuantityInCase: 1,
          PrepDetailsList: [],
        }

        expect(
          canonicalizeInboundShipmentPlanRequestItems(mock)['PrepDetailsList.PrepDetails'],
        ).toStrictEqual(mock.PrepDetailsList)
      })
    })

    describe('canonicalizeInboundShipmentItem', () => {
      it('properly canonicalizes InboundShipmentItem', () => {
        expect.assertions(2)

        const mockDate = new Date()
        const mock: InboundShipmentItem = {
          ShipmentId: '',
          SellerSKU: '',
          PrepDetailsList: [],
          QuantityShipped: 1,
          ReleaseDate: mockDate,
        }
        const canonicalized = canonicalizeInboundShipmentItem(mock)

        expect(canonicalized['PrepDetailsList.PrepDetails']).toStrictEqual(mock.PrepDetailsList)
        expect(canonicalized.ReleaseDate).toStrictEqual(canonicalizeDate(mockDate))
      })
    })

    describe('canonicalizeParametersCreateUpdateInboundShipment', () => {
      it('properly canonicalized CreateInboundShipmentParameters', () => {
        expect.assertions(1)

        const mock: CreateInboundShipmentParameters = {
          ShipmentId: '',
          InboundShipmentHeader: mockInboundShipmentHeader,
          InboundShipmentItems: [mockInboundShipmentItem],
        }

        const canonicalized = canonicalizeParametersCreateUpdateInboundShipment(mock)

        expect(canonicalized['InboundShipmentItems.member'][0]).toStrictEqual(
          canonicalizeInboundShipmentItem(mock.InboundShipmentItems[0]),
        )
      })
    })

    describe('canonicalizePutTransportContentParameters', () => {
      it('properly canonicalizes PutTransportContentParameters', () => {
        expect.assertions(2)

        const mockDate = new Date()
        const mock = {
          ShipmentId: '',
          IsPartnered: true,
          ShipmentType: '',
          TransportDetails: {
            PartneredLtlData: {
              Contact: mockContact,
              BoxCount: 1,
              FreightReadyDate: mockDate,
              PalletList: [mockPallet],
            },
          },
        }
        const canonicalized = canonicalizePutTransportContentParameters(mock)
        const { PartneredLtlData } = canonicalized.TransportDetails

        expect(PartneredLtlData).toBeDefined()
        expect(PartneredLtlData ? PartneredLtlData['PalletList.member'] : undefined).toStrictEqual(
          mock.TransportDetails.PartneredLtlData.PalletList,
        )
      })
    })
  })

  describe('listInboundShipmentItemsByNextToken', () => {
    const mockNextToken = new NextToken('ListInboundShipmentItems', '123')

    it('returns a list of inbound shipment item data if succesful', async () => {
      expect.assertions(1)

      const mockListInboundShipmentItemsByNextToken = createMockHttpClient(
        'fulfillment_inbound_shipment_list_inbound_shipment_items_nt',
      )

      expect(
        await mockListInboundShipmentItemsByNextToken.fulfillmentInboundShipment.listInboundShipmentItemsByNextToken(
          mockNextToken,
        ),
      ).toMatchSnapshot()
    })

    it('throws a parsing error  when the status response is not valid', async () => {
      expect.assertions(1)

      await expect(() =>
        mockParsingError.fulfillmentInboundShipment.listInboundShipmentItemsByNextToken(
          mockNextToken,
        ),
      ).rejects.toThrow(parsingErrorRegex)
    })
  })

  describe('listInboundShipmentItems', () => {
    const parameters = {
      ShipmentId: '',
    }

    it('returns list of item data if succesful', async () => {
      expect.assertions(1)

      const mockListInboundShipmentItems = createMockHttpClient(
        'fulfillment_inbound_shipment_list_inbound_shipment_items',
      )

      expect(
        await mockListInboundShipmentItems.fulfillmentInboundShipment.listInboundShipmentItems(
          parameters,
        ),
      ).toMatchSnapshot()
    })

    it('throws a parsing error when  the status response is not valid', async () => {
      expect.assertions(1)

      await expect(() =>
        mockParsingError.fulfillmentInboundShipment.listInboundShipmentItems(parameters),
      ).rejects.toThrow(parsingErrorRegex)
    })
  })

  describe('listInboundShipmentsByNextToken', () => {
    const mockNextToken = new NextToken('ListInboundShipments', '123')

    it('returns shipment data if succesful', async () => {
      expect.assertions(1)

      const mockListInboundShipmentsNT = createMockHttpClient(
        'fulfillment_inbound_shipment_list_inbound_shipments_nt',
      )

      expect(
        await mockListInboundShipmentsNT.fulfillmentInboundShipment.listInboundShipmentsByNextToken(
          mockNextToken,
        ),
      ).toMatchSnapshot()
    })

    it('throws a parsing error when  the status response is not valid', async () => {
      expect.assertions(1)

      await expect(() =>
        mockParsingError.fulfillmentInboundShipment.listInboundShipmentsByNextToken(mockNextToken),
      ).rejects.toThrow(parsingErrorRegex)
    })
  })

  describe('listInboundShipments', () => {
    const parameters = {
      ShipmentStatusList: ['WORKING'],
      ShipmentIdList: [''],
    }

    it('returns the correct structure succesfully', async () => {
      expect.assertions(1)

      const mockListInboundShipments = createMockHttpClient(
        'fulfillment_inbound_shipment_list_inbound_shipments_from_c_sharp',
      )

      expect(
        await mockListInboundShipments.fulfillmentInboundShipment.listInboundShipments(parameters),
      ).toMatchSnapshot()
    })

    it('returns shipment data if succesful', async () => {
      expect.assertions(1)

      const mockListInboundShipments = createMockHttpClient(
        'fulfillment_inbound_shipment_list_inbound_shipments',
      )

      expect(
        await mockListInboundShipments.fulfillmentInboundShipment.listInboundShipments(parameters),
      ).toMatchSnapshot()
    })

    it('throws a parsing error when the  status response is not valid', async () => {
      expect.assertions(1)

      await expect(() =>
        mockParsingError.fulfillmentInboundShipment.listInboundShipments(parameters),
      ).rejects.toThrow(parsingErrorRegex)
    })
  })

  describe('getBillOfLading', () => {
    const parameters = {
      ShipmentId: '',
    }

    it('returns PDF document data if succesful', async () => {
      expect.assertions(1)

      const mockGetBillOfLading = createMockHttpClient(
        'fulfillment_inbound_shipment_get_bill_of_lading',
      )

      expect(
        await mockGetBillOfLading.fulfillmentInboundShipment.getBillOfLading(parameters),
      ).toMatchSnapshot()
    })

    it('throws a parsing error when the  status response is not valid', async () => {
      expect.assertions(1)

      await expect(() =>
        mockParsingError.fulfillmentInboundShipment.getBillOfLading(parameters),
      ).rejects.toThrow(parsingErrorRegex)
    })
  })

  describe('getPalletLabels', () => {
    const parameters = {
      ShipmentId: '',
      PageType: mockPageType,
      NumberOfPallets: 1,
    }

    it('returns PDF document data if succesful', async () => {
      expect.assertions(1)

      const mockGetPalletLabels = createMockHttpClient(
        'fulfillment_inbound_shipment_get_pallet_labels',
      )

      expect(
        await mockGetPalletLabels.fulfillmentInboundShipment.getPalletLabels(parameters),
      ).toMatchSnapshot()
    })

    it('throws a parsing error when the status  response is not valid', async () => {
      expect.assertions(1)

      await expect(() =>
        mockParsingError.fulfillmentInboundShipment.getPalletLabels(parameters),
      ).rejects.toThrow(parsingErrorRegex)
    })
  })

  describe('getUniquePackageLabels', () => {
    const parameters: GetUniquePackageLabelsParameters = {
      ShipmentId: '',
      PageType: mockPageType,
      PackageLabelsToPrint: [''],
    }

    it('returns the transport document if succesful', async () => {
      expect.assertions(1)

      const mockGetUniquePackageLabels = createMockHttpClient(
        'fulfillment_inbound_shipment_get_unique_package_labels',
      )

      expect(
        await mockGetUniquePackageLabels.fulfillmentInboundShipment.getUniquePackageLabels(
          parameters,
        ),
      ).toMatchSnapshot()
    })

    it('throws a parsing error when the status  response is not valid', async () => {
      expect.assertions(1)

      await expect(() =>
        mockParsingError.fulfillmentInboundShipment.getUniquePackageLabels(parameters),
      ).rejects.toThrow(parsingErrorRegex)
    })
  })

  describe('getPackageLabels', () => {
    const parameters: GetPackageLabelsParameters = {
      ShipmentId: '',
      PageType: mockPageType,
    }

    it('returns the transport document if succesful', async () => {
      expect.assertions(1)

      const mockGetPackageLabels = createMockHttpClient(
        'fulfillment_inbound_shipment_get_package_labels',
      )

      expect(
        await mockGetPackageLabels.fulfillmentInboundShipment.getPackageLabels(parameters),
      ).toMatchSnapshot()
    })

    it('throws a parsing error when the status response is  not valid', async () => {
      expect.assertions(1)

      await expect(() =>
        mockParsingError.fulfillmentInboundShipment.getPackageLabels(parameters),
      ).rejects.toThrow(parsingErrorRegex)
    })
  })

  describe('voidTransportRequest', () => {
    const parameters = {
      ShipmentId: '',
    }

    it('returns the transport result if voiding is succesful', async () => {
      expect.assertions(1)

      const mockVoidTransportRequest = createMockHttpClient(
        'fulfillment_inbound_shipment_void_transport_request',
      )

      expect(
        await mockVoidTransportRequest.fulfillmentInboundShipment.voidTransportRequest(parameters),
      ).toMatchSnapshot()
    })

    it('throws a parsing error when the status response is  not valid', async () => {
      expect.assertions(1)

      await expect(() =>
        mockParsingError.fulfillmentInboundShipment.voidTransportRequest(parameters),
      ).rejects.toThrow(parsingErrorRegex)
    })
  })

  describe('confirmTransportRequest', () => {
    const parameters = {
      ShipmentId: '',
    }

    it('returns the transport result if succesful', async () => {
      expect.assertions(1)

      const mockConfirmTransportRequest = createMockHttpClient(
        'fulfillment_inbound_shipment_confirm_transport_request',
      )

      expect(
        await mockConfirmTransportRequest.fulfillmentInboundShipment.confirmTransportRequest(
          parameters,
        ),
      ).toMatchSnapshot()
    })

    it('throws a parsing error when the status response  is not valid', async () => {
      expect.assertions(1)

      await expect(() =>
        mockParsingError.fulfillmentInboundShipment.confirmTransportRequest(parameters),
      ).rejects.toThrow(parsingErrorRegex)
    })
  })

  describe('getTransportContent', () => {
    const parameters = {
      ShipmentId: '',
    }

    it('returns the transport content for LTL if succesful', async () => {
      expect.assertions(1)

      const mockGetTransportContent = createMockHttpClient(
        'fulfillment_inbound_shipment_get_transport_content_ltl',
      )

      expect(
        await mockGetTransportContent.fulfillmentInboundShipment.getTransportContent(parameters),
      ).toMatchSnapshot()
    })

    it('returns the transport content if succesful', async () => {
      expect.assertions(1)

      const mockGetTransportContent = createMockHttpClient(
        'fulfillment_inbound_shipment_get_transport_content',
      )

      expect(
        await mockGetTransportContent.fulfillmentInboundShipment.getTransportContent(parameters),
      ).toMatchSnapshot()
    })

    it('throws a parsing error when the status response  is not valid', async () => {
      expect.assertions(1)

      await expect(() =>
        mockParsingError.fulfillmentInboundShipment.getTransportContent(parameters),
      ).rejects.toThrow(parsingErrorRegex)
    })
  })

  describe('estimateTransportRequest', () => {
    const parameters = {
      ShipmentId: '',
    }

    it('returns the workflow status for a shipment if succesful', async () => {
      expect.assertions(1)

      const mockEstimateTransportRequest = createMockHttpClient(
        'fulfillment_inbound_shipment_estimate_transport_request',
      )

      expect(
        await mockEstimateTransportRequest.fulfillmentInboundShipment.estimateTransportRequest(
          parameters,
        ),
      ).toMatchSnapshot()
    })

    it('throws a parsing error when the status response i snt valid', async () => {
      expect.assertions(1)

      await expect(() =>
        mockParsingError.fulfillmentInboundShipment.estimateTransportRequest(parameters),
      ).rejects.toThrow(parsingErrorRegex)
    })
  })

  describe('putTransportContent', () => {
    const mockPartneredSmallParcelPackageInput: PartneredSmallParcelPackageInput = {
      Dimensions: {
        Unit: 'inches',
        Length: 1,
        Width: 1,
        Height: 1,
      },
      Weight: {
        Unit: 'pounds',
        Value: 1,
      },
    }

    const mockTransportDetailInput = {
      PartneredSmallParcelData: {
        CarrierName: '',
        PackageList: [mockPartneredSmallParcelPackageInput],
      },
    }

    const parameters = {
      ShipmentId: '',
      IsPartnered: true,
      ShipmentType: 'SP',
      TransportDetails: mockTransportDetailInput,
    }

    it('returns tranport result if succesful', async () => {
      expect.assertions(1)

      const mockPutTransportContent = createMockHttpClient(
        'fulfillment_inbound_shipment_put_transport_content',
      )

      expect(
        await mockPutTransportContent.fulfillmentInboundShipment.putTransportContent(parameters),
      ).toMatchSnapshot()
    })

    it('throws a parsing error when the status response i snt valid', async () => {
      expect.assertions(1)

      await expect(() =>
        mockParsingError.fulfillmentInboundShipment.putTransportContent(parameters),
      ).rejects.toThrow(parsingErrorRegex)
    })
  })

  describe('getPrepInstructionsForAsin', () => {
    const parameters = {
      ASINList: [''],
      ShipToCountryCode: 'US',
    }

    it('returns list of prep instructions if succesful', async () => {
      expect.assertions(1)

      const mockGetPrepInstructionsForAsin = createMockHttpClient(
        'fulfillment_inbound_shipment_get_prep_instructions_for_asin',
      )

      expect(
        await mockGetPrepInstructionsForAsin.fulfillmentInboundShipment.getPrepInstructionsForAsin(
          parameters,
        ),
      ).toMatchSnapshot()
    })

    it('throws a parsing error when the status response is nt valid', async () => {
      expect.assertions(1)

      await expect(() =>
        mockParsingError.fulfillmentInboundShipment.getPrepInstructionsForAsin(parameters),
      ).rejects.toThrow(parsingErrorRegex)
    })
  })

  describe('getPrepInstructionsForSku', () => {
    const parameters = {
      SellerSKUList: [],
      ShipToCountryCode: 'US',
    }

    it('returns prep instructions list if succesful', async () => {
      expect.assertions(1)

      const mockGetPrepInstructionsForSku = createMockHttpClient(
        'fulfillment_inbound_shipment_get_prep_instructions_for_sku',
      )

      expect(
        await mockGetPrepInstructionsForSku.fulfillmentInboundShipment.getPrepInstructionsForSku(
          parameters,
        ),
      ).toMatchSnapshot()
    })

    it('throws a parsing error when the status response is nt valid', async () => {
      expect.assertions(1)

      await expect(() =>
        mockParsingError.fulfillmentInboundShipment.getPrepInstructionsForSku(parameters),
      ).rejects.toThrow(parsingErrorRegex)
    })
  })

  describe('confirmPreorder', () => {
    const parameters = {
      ShipmentId: '',
      NeedByDate: new Date(),
    }

    it('returns confirmed dates if succesful', async () => {
      expect.assertions(1)

      const mockConfirmPreorder = createMockHttpClient(
        'fulfillment_inbound_shipment_confirm_preorder',
      )

      expect(
        await mockConfirmPreorder.fulfillmentInboundShipment.confirmPreorder(parameters),
      ).toMatchSnapshot()
    })

    it('throws a parsing error when the status response isn t valid', async () => {
      expect.assertions(1)

      await expect(() =>
        mockParsingError.fulfillmentInboundShipment.confirmPreorder(parameters),
      ).rejects.toThrow(parsingErrorRegex)
    })
  })

  describe('getPreorderInfo', () => {
    const parameters = { ShipmentId: '' }

    it('returns preorderinfo if succesful', async () => {
      expect.assertions(1)

      const mockGetPreorderInfo = createMockHttpClient(
        'fulfillment_inbound_shipment_get_preorder_info',
      )

      expect(
        await mockGetPreorderInfo.fulfillmentInboundShipment.getPreorderInfo(parameters),
      ).toMatchSnapshot()
    })

    it('throws a parsing error when the status response isn t valid', async () => {
      expect.assertions(1)

      await expect(() =>
        mockParsingError.fulfillmentInboundShipment.getPreorderInfo(parameters),
      ).rejects.toThrow(parsingErrorRegex)
    })
  })

  describe('updateInboundShipment', () => {
    const parameters = {
      ShipmentId: '',
      InboundShipmentHeader: mockInboundShipmentHeader,
      InboundShipmentItems: [mockInboundShipmentItem],
    }

    it('return the shipment id if succesful', async () => {
      expect.assertions(1)

      const mockUpdateInboundShipment = createMockHttpClient(
        'fulfillment_inbound_shipment_update_inbound_shipment',
      )

      expect(
        await mockUpdateInboundShipment.fulfillmentInboundShipment.updateInboundShipment(
          parameters,
        ),
      ).toMatchSnapshot()
    })

    it("throws a parsing error when the status response isn't valid", async () => {
      expect.assertions(1)

      await expect(() =>
        mockParsingError.fulfillmentInboundShipment.updateInboundShipment(parameters),
      ).rejects.toThrow(parsingErrorRegex)
    })
  })

  describe('createInboundShipment', () => {
    const parameters: CreateInboundShipmentParameters = {
      ShipmentId: '',
      InboundShipmentHeader: mockInboundShipmentHeader,
      InboundShipmentItems: [mockInboundShipmentItem],
    }

    it('returns the shipment ID if succesful', async () => {
      expect.assertions(1)

      const mockCreateInboundShipment = createMockHttpClient(
        'fulfillment_inbound_shipment_create_inbound_shipment',
      )

      expect(
        await mockCreateInboundShipment.fulfillmentInboundShipment.createInboundShipment(
          parameters,
        ),
      ).toMatchSnapshot()
    })

    it("throws a parsing error when the status response isn't valid", async () => {
      expect.assertions(1)

      await expect(() =>
        mockParsingError.fulfillmentInboundShipment.createInboundShipment(parameters),
      ).rejects.toThrow(parsingErrorRegex)
    })
  })

  describe('createInboundShipmentPlan', () => {
    const mockInboundShipmentPlanRequestItem = {
      SellerSKU: '',
      Quantity: 1,
    }

    const parameters = {
      ShipFromAddress: mockAddress,
      InboundShipmentPlanRequestItems: [mockInboundShipmentPlanRequestItem],
    }

    it('returns inbound shipment plans if succesful', async () => {
      expect.assertions(1)

      const mockCreateInboundShipmentPlan = createMockHttpClient(
        'fulfillment_inbound_shipment_create_inbound_shipment_plan',
      )

      expect(
        await mockCreateInboundShipmentPlan.fulfillmentInboundShipment.createInboundShipmentPlan(
          parameters,
        ),
      ).toMatchSnapshot()
    })

    it('throws a parsing error when the status response isnt valid', async () => {
      expect.assertions(1)

      await expect(() =>
        mockParsingError.fulfillmentInboundShipment.createInboundShipmentPlan(parameters),
      ).rejects.toThrow(parsingErrorRegex)
    })
  })

  describe('getInboundGuidanceForAsin', () => {
    const parameters = {
      ASINList: [],
      MarketplaceId: '',
    }

    it('returns sku inbound guidance list if succesful', async () => {
      expect.assertions(1)

      const mockGetInboundGuidanceForSku = createMockHttpClient(
        'fulfillment_inbound_shipment_get_inbound_guidance_for_asin',
      )

      expect(
        await mockGetInboundGuidanceForSku.fulfillmentInboundShipment.getInboundGuidanceForAsin(
          parameters,
        ),
      ).toMatchSnapshot()
    })

    it('throws a parsing error when the status response isnt valid', async () => {
      expect.assertions(1)

      await expect(() =>
        mockParsingError.fulfillmentInboundShipment.getInboundGuidanceForAsin(parameters),
      ).rejects.toThrow(parsingErrorRegex)
    })
  })

  describe('getInboundGuidanceForSku', () => {
    const parameters = {
      SellerSKUList: [],
      MarketplaceId: '',
    }

    it('returns sku inbound guidance list if succesful', async () => {
      expect.assertions(1)

      const mockGetInboundGuidanceForSku = createMockHttpClient(
        'fulfillment_inbound_shipment_get_inbound_guidance_for_sku',
      )

      expect(
        await mockGetInboundGuidanceForSku.fulfillmentInboundShipment.getInboundGuidanceForSku(
          parameters,
        ),
      ).toMatchSnapshot()
    })

    it('throws a parsing error when the status response is not valid', async () => {
      expect.assertions(1)

      await expect(() =>
        mockParsingError.fulfillmentInboundShipment.getInboundGuidanceForSku(parameters),
      ).rejects.toThrow(parsingErrorRegex)
    })
  })

  describe('getServiceStatus', () => {
    it('returns a parsed model when the status response is valid', async () => {
      expect.assertions(1)

      expect(
        await mockMwsServiceStatus.fulfillmentInboundShipment.getServiceStatus(),
      ).toMatchSnapshot()
    })

    it('throws a parsing error when the status response is not valid', async () => {
      expect.assertions(1)

      await expect(() =>
        mockParsingError.fulfillmentInboundShipment.getServiceStatus(),
      ).rejects.toThrow(parsingErrorRegex)
    })
  })
})
