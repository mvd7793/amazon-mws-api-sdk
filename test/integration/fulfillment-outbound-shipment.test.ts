import { FulfillmentOutboundShipment } from '../../src'
import { Config } from './config'
import { itci } from './it'

const httpClient = new Config().createHttpClient()

/* eslint-disable jest/no-standalone-expect */
describe(`${FulfillmentOutboundShipment.name}`, () => {
  itci('should be able to query service status', async () => {
    expect.assertions(1)

    const fos = new FulfillmentOutboundShipment(httpClient)

    const [response] = await fos.getServiceStatus()

    expect(response.Status).toMatch(/GREEN|YELLOW|RED/)
  })
})
/* eslint-enable jest/no-standalone-expect */
