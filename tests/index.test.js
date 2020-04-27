const test = require('tape')
const CreateTestSbot = require('scuttle-testbot')
const ssbKeys = require('ssb-keys')
const SsbWiki = require('../')

test('wiki', async t => {
  // the graph i'm aiming for
  //
  //     A   (root)
  //     |
  //     B
  //    / \
  //   C   D
  //    \ /
  //     E
  //     |
  //     F

  const aliciaKeys = ssbKeys.generate()
  const bobbyKeys = ssbKeys.generate()
  
  const myTempSbot = (CreateTestSbot
    .use(require('ssb-query'))
  )({ name: 'ssb-wiki-testbot' })

  const ssbWiki = SsbWiki(myTempSbot)
  
  const alicia = myTempSbot.createFeed(aliciaKeys)
  const bobby = myTempSbot.createFeed(bobbyKeys)
  
  const rootMsg = await publish(alicia, ssbWiki.newWiki())
  fancyLog(rootMsg)
  const rootKey = rootMsg.key

  await publish(bobby, { type: 'test', content: 'a normal message just because' })

  // B
  let heads = await ssbWiki.getHeads(rootKey)
  t.equals(heads.length, 1, 'A regular edit after root should have 1 parent')
  fancyLog(await publish(alicia, ssbWiki.newEdit(rootKey, heads[0], {
    text: 'How 2 cook potatoes:',
    mentions: [{ link: '&KFoVS0P4Ps7BQzfBn3IOqV/Ujc9j8XAip5t01tRj74Y=.sha256'}]
  })))


  // C
  heads = await ssbWiki.getHeads(rootKey)
  t.equals(heads.length, 1, 'A regular edit after a regular edit should have 1 parent')
  fancyLog(await publish(alicia, ssbWiki.newEdit(rootKey, heads[0], {
    text: 'How 2 cook potatoes: boil em'
  })))

  // D
  // we use the same head as C, causing a fork, oh no!
  // (bobby was out gardening when alicia made her edit and he made his)
  fancyLog(await publish(bobby, ssbWiki.newEdit(rootKey, heads[0], {
    text: 'How 2 cook potatoes: mash em'
  })))

  // E
  // alicia merges both edits
  heads = await ssbWiki.getHeads(rootKey)
  t.equals(heads.length, 2, 'This merge should have 2 parents')
  fancyLog(await publish(alicia, ssbWiki.newMerge(rootKey, heads, {
    text: 'How 2 cook potatoes: boil em, mash em'
  })))

  // F
  heads = await ssbWiki.getHeads(rootKey)
  // console.log('tooheads:', heads)
  // await ssbWiki.printMap(rootKey)
  // todo: fix ssb-tangle bug, this should be 1 but is 2 (the same key is there twice)
  // https://github.com/ssbc/ssb-tangle/issues/7
  // t.equals(heads.length, 1, 'A regular edit after a merge should have 1 parent')
  fancyLog(await publish(bobby, ssbWiki.newEdit(rootKey, heads[0], {
    text: 'How 2 cook potatoes: boil em, mash em, stick em in a stew'
  })))

  console.log('map:')
  await ssbWiki.printMap(rootKey)

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

function fancyLog (obj) {
  console.log(JSON.stringify(obj, null, 2))
}