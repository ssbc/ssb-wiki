const test = require('tape')
const CreateTestSbot = require('scuttle-testbot')
const ssbKeys = require('ssb-keys')
const SsbWiki = require('../')

test('wiki', async t => {
  const aliciaKeys = ssbKeys.generate()
  const bobbyKeys = ssbKeys.generate()
  
  const myTempSbot = (CreateTestSbot
    .use(require('ssb-query'))
  )({ name: 'ssb-wiki-testbot' })

  const ssbWiki = SsbWiki(myTempSbot)
  
  const alicia = myTempSbot.createFeed(aliciaKeys)
  const bobby = myTempSbot.createFeed(bobbyKeys)
  
  const rootMsg = await publish(alicia, ssbWiki.newWiki())

  console.log(rootMsg)
  const rootKey = rootMsg.key

  console.log(await publish(bobby, { type: 'test', content: 'a normal message just because' }))

  let heads = await ssbWiki.getHeads(rootKey)
  fancylog(await publish(alicia, ssbWiki.newEdit(rootKey, heads[0].key, {
    text: 'How 2 cook potatoes',
    mentions: [{ link: '&KFoVS0P4Ps7BQzfBn3IOqV/Ujc9j8XAip5t01tRj74Y=.sha256'}]
  })))

  heads = await ssbWiki.getHeads(rootKey)
  console.log('heads2')
  fancylog(heads)

  myTempSbot.close()

  t.end()
})

async function publish (user, message) {
  return new Promise((resolve, reject) => {
    user.add(message, (err, data) => {
      if (err) return reject(err)

      return resolve(data)
    })
  })
}

function fancylog (obj) {
  console.log(JSON.stringify(obj, null, 2))
}