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

  console.log(await publish(bobby, {type: 'test', content: 'a normal message'}))

  const heads = await ssbWiki.getHeads(rootKey)

  console.log('heads (not heads yet)', JSON.stringify(heads, null, 2))

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