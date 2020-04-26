const pull = require('pull-stream')
const _ = {
  get: require('lodash.get')
}
const { getHeads } = require('ssb-tangle/lib/misc-junk')

module.exports = server => ({
  newWiki: () => {
    return {
      type: 'wikiwiki'
    }
  },

  newEdit: (rootKey, previousKey, content) => {
    // todo: use one of those fancy functions that checks that it looks like an
    // actual ssb link instead
    if (typeof previousKey !== 'string') throw 'previousKey has to be a reference to the message being edited: ' + previousKey

    return newEditOrMerge(rootKey, [previousKey], content)
  },

  newMerge: (rootKey, previousKeys, content) => {
    if (previousKeys.length < 2) throw 'A merge needs 2 messages or more: ' + previousKeys

    return newEditOrMerge(rootKey, previousKeys, content)
  },

  getHeads: async rootKey => {
    return getTangleMembers(server, rootKey)
    // todo filter members for heads only
  }
})

function newEditOrMerge (rootKey, previousKeys, content) {
  // all messages in `previousKeys` (an array of keys) should have the same root
  // the only difference between a normal edit and a merge is:
  // in a normal edit, previousKeys.length === 1
  // in a merge, previousKeys.length > 1

  return {
    type: 'wikiwiki',
    // how do mention indexing work? will they be detected if `content` is
    // content: {
    //   text: 'example',
    //   mentions: [...]
    // }
    // or does the mentions array need to be top level in the message?
    content: content,
    tangle: {
      root: rootKey,
      previous: previousKeys
    }
  }
}

async function getTangleMembers (server, rootKey) {
  return new Promise((resolve, reject) => {
    pull(
      // first find everything that isn't the root
      server.query.read({ query: [{
        $filter: {
          value: {
            content: {
              type: 'wikiwiki',
              tangle: {
                root: rootKey
              }
            }
          }
        }
      }]}),
      pull.collect((err, replies) => {
        if (err) return reject(err)

        // then get the root
        server.get({ id: rootKey, meta: true }, (err, rootMsg) => {
          if (err) return reject(err)

          replies.push(rootMsg)
          return resolve(replies)
        })
      })
    )
  })
}
