const test = require('tape')
const CreateTestSbot = require('scuttle-testbot')
const ssbKeys = require('ssb-keys')

test('wiki', t => {
  const aliciaKeys = ssbKeys.generate()
  const bobbyKeys = ssbKeys.generate()
  
  const myTempSbot = CreateTestSbot({ name: 'ssb-wiki-testbot' })
  
  const alicia = myTempSbot.createFeed(aliciaKeys)
  const bobby = myTempSbot.createFeed(bobbyKeys)
  
  alicia.add({type: 'test', content: 'a test message'}, (err, data) => {
    if (err) throw err

    console.log(data)

    bobby.add({type: 'test', content: 'a test message more'}, (err, data) => {
      if (err) throw err

      console.log(data)

      myTempSbot.close()
    })
  })

  t.end()
})
