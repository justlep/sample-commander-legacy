
'use strict';

let {_, Helper} = require('./common'),
    MIDDLE_HASH_BYTES = 20, // must be round
    nodeFs = require('fs'),
    nodeCrypto = require('crypto'),
    nodePath = require('path'),
    middleHashCache = {}, // map of '{fileItem.id}' -> {middleHash}
    fullHashCache = {};   // map of '{fileItem.id}' -> {fullHash}

/**
 * Calculates the middle- or full hash for a given file item, then passes it to the callback.
 * Middle = hash of the center {@link MIDDLE_HASH_BYTES} bytes of the file
 * Full = hash over the entire file content
 * @param fileItem (Object) file item created in the PathWatcher
 * @param callback (function) e.g. function(hash) {..}
 * @param useFullHash (boolean) if true, the full hash is calculated instead of the middle hash
 * @param [noCache] (boolean) if true, the cache is (re-)calculated, ignoring the cache
 */
function calculateHash(fileItem, callback, useFullHash, noCache) {
    var filePath = nodePath.resolve(fileItem.path),
        cacheKey = fileItem.id,
        cache = (useFullHash) ? fullHashCache : middleHashCache;

    if (!noCache && cache[cacheKey]) {
        callback(cache[cacheKey]);
        return;
    }

    if (!fileItem.filesize) {
        cache[cacheKey] = '_ZERO';
        callback(cache[cacheKey]);
        return;
    }

    var hash = nodeCrypto.createHash('sha1'),
        fileCenterOffset = Math.floor(fileItem.filesize / 2),
        endIndex = fileItem.filesize - 1,
        streamOpts = {
            start: (useFullHash) ? 0 : fileCenterOffset,
            end: (useFullHash) ? endIndex : Math.min(fileCenterOffset + MIDDLE_HASH_BYTES - 1, endIndex)
        },
        readStream = nodeFs.ReadStream(filePath, streamOpts);

    // console.log('Reading offsets %s till %s of %s', streamOpts.start, streamOpts.end, fileItem.filesize);

    readStream.on('data', function(d) {
        hash.update(d);
    });

    readStream.on('end', function() {
        cache[cacheKey] = hash.digest('hex');
        callback(cache[cacheKey]);
    });
}

function calculateMiddleHash(fileItem, callback, noCache) {
    calculateHash(fileItem, callback, false, noCache);
}

/*
function calculateFullHash(fileItem, callback, noCache) {
    calculateHash(fileItem, callback, true, noCache);
}
*/

/**
 * Finds duplicate file items for the sourcelsit
 * @param sourceList (Array) of source file items
 * @param targetList (Array) of target file items
 * @param callback (function) when all files are compared e.g. function() {..}
 */
function checkDuplicateFileItems(sourceList, targetList, callback) {
    Helper.assertArray(sourceList, 'invalid sourceList for checkDuplicateFileItems');
    Helper.assertArray(targetList, 'invalid targetList for checkDuplicateFileItems');
    Helper.assertFunction(callback, 'invalid callback for checkDuplicateFileItems');

    var sourceFilesRemaining = sourceList.length,
        targetSizeMap = {}; // map of targetSize -> [targetItem, ..]

    // prepare a map of target filesizes
    _.each(targetList, function(targetItem) {
        if (!targetSizeMap[targetItem.filesize]) {
            targetSizeMap[targetItem.filesize] = [];
        }
        targetSizeMap[targetItem.filesize].push(targetItem);
    });

    _.each(sourceList, function(sourceItem){
        var targetItemsOfSameSize = targetSizeMap[sourceItem.filesize];
        sourceItem.duplicateIds = null;

        if (!targetItemsOfSameSize || !targetItemsOfSameSize.length) {
            // different size
            if (! --sourceFilesRemaining) {
                callback();
                return;
            }
        } else {
            calculateMiddleHash(sourceItem, function(sourceHash) {
                var targetItemsRemaining = targetItemsOfSameSize.length;
                _.each(targetItemsOfSameSize, function(targetItem){
                    calculateMiddleHash(targetItem, function(targetHash) {
                        if (sourceHash === targetHash) {
                            if (!sourceItem.duplicateIds) {
                                sourceItem.duplicateIds = [targetItem.id];
                            } else {
                                sourceItem.duplicateIds.push(targetItem.id)
                            }
                        }
                        if (! --targetItemsRemaining && ! --sourceFilesRemaining ) {
                            callback();
                            return;
                        }
                    });
                });
            });
        }
    });
}

function flushCacheForFileItems(fileItems) {
    Helper.assertArray(fileItems, 'invalid fileItems for flushCacheForFileItems');
    _.each(fileItems, function(fileItem) {
        delete middleHashCache[fileItem.id];
        delete fullHashCache[fileItem.id];
    });
}

module.exports = {
    checkDuplicateFileItems: checkDuplicateFileItems,
    flushCacheForFileItems: flushCacheForFileItems
}