const pull = require('pull-stream')
const { getHeads } = require('ssb-tangle/lib/misc-junk')

module.exports = server => ({
  newWiki: () => {
    return {
      type: 'wikiwiki'
    }
  },

  getHeads: async root => {
    return getTangleMembers(server, root)
    // todo filter members for heads only
  }
})

async function getTangleMembers (server, root) {
  return new Promise((resolve, reject) => {
    pull(
      // first find everything that isn't the root
      server.query.read({ query: [{
        $filter: {
          value: {
            content: {
              type: 'wikiwiki',
              tangle: {
                root: root
              }
            }
          }
        }
      }]}),
      pull.collect((err, replies) => {
        if (err) return reject(err)

        // then get the root
        server.get(root, (err, rootMsg) => {
          if (err) return reject(err)

          replies.push(rootMsg)
          return resolve(replies)
        })
      })
    )
  })
}
