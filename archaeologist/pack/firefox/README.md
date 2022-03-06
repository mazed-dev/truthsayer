# For Firefox

This is an instruction how to build, pack and submit archaeologist to Mozilla web store.

We have an account for [Mozilla Developers Hub](https://addons.mozilla.org/en-GB/developers/), registered for an email `thread.knowledge@gmail.com`. Ask @akindyakov for credentials.
'

All commands listed here should be ran at the root of this repo.

To build:
```
% yarn archaeologist build:firefox:public
```

To pack:
```
% yarn archaeologist web-ext build --source-dir target/unpacked --artifacts-dir target/packed --overwrite-dest
```

To submit new version via Mozilla API key and secret are needed, use [special page at Mozilla developers portal](https://addons.mozilla.org/en-US/developers/addon/api/key/) to issue your personal credentials.

Once you have key and secret, you can submit a new version with following command:

```
% yarn archaeologist web-ext sign --source-dir target/unpacked --artifacts-dir target/packed --api-key '<>' --api-secret '<>' --channel listed
```

You can find latest published version of Mazed for Firefox in [Mozilla web store](https://addons.mozilla.org/en-GB/firefox/addon/mazed/).
