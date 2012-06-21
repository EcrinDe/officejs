/**
 * Adds 6 storages to JIO.
 * - LocalStorage ('local')
 * - DAVStorage ('dav')
 * - ReplicateStorage ('replicate')
 * - IndexedStorage ('indexed')
 * - CryptedStorage ('crypted')
 * - ConflictManagerStorage ('conflictmanager')
 *
 * @module JIOStorages
 */
(function(LocalOrCookieStorage, $, Base64, sjcl, MD5, Jio) {
