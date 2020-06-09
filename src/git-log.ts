import * as fs from 'fs'
// eslint-disable-next-line import/no-extraneous-dependencies
import git from 'isomorphic-git'
// eslint-disable-next-line import/no-extraneous-dependencies
import { groupBy, uniqBy } from 'lodash'
import { resolve } from 'path'

const GIT_ROOT = resolve(__dirname, '../')
const EMAILS = new Set(['justinemmanuelmercado@gmail.com', 'ej@ejmercado.com'])
const START_DATE = new Date('May 25, 2020 00:00:00 GMT+7')
const END_DATE = new Date('June 9, 2020 23:59:59 GMT+7')

function tsToDate(timestamp: number) {
  return new Date(timestamp * 1000)
}

async function main() {
  const log = await git.log({ fs, dir: GIT_ROOT })

  // grab unique commits
  const uniqueLog = uniqBy(log, (l) => l.commit.author.timestamp)

  const authorLog = uniqueLog
    // find MJ's log
    .filter((l) => EMAILS.has(l.commit.author.email.toLowerCase()))

    // removes merge commits
    .filter((l) => !l.commit.message.includes('Merge '))

    // find log items within invoice date
    .filter((l) => {
      const authorTimestamp = tsToDate(l.commit.author.timestamp)
      return authorTimestamp >= START_DATE && authorTimestamp <= END_DATE
    })

    // sort by timestamp
    .sort((a, b) => a.commit.author.timestamp - b.commit.author.timestamp)

  // group by day
  const groupedLog = groupBy(
    authorLog,
    (l) => tsToDate(l.commit.author.timestamp).toISOString().split('T')[0],
  )

  // iterate over days
  Object.keys(groupedLog).forEach((day) => {
    const logs = groupedLog[day]

    // get the last commit of the day
    const lastEntry = logs.slice(-1)[0]

    // get duration between the first and last commit of the day
    const duration = new Date(
      (lastEntry.commit.author.timestamp - logs[0].commit.author.timestamp) * 1000,
    )
      .toISOString()
      .slice(11, 19)

    console.info('\n## %s (%s)\n', day, duration)

    logs.forEach((l) => {
      console.info(
        ' * [`%s`](https://github.com/ScaleLeap/amazon-mws-api-sdk/commit/%s) `%s` - %s',
        l.oid.slice(0, 6),
        l.oid,
        tsToDate(l.commit.author.timestamp).toTimeString(),
        l.commit.message.trim(),
      )
    })
  })
}

main()
