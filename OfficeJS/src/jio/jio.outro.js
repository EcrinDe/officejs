// Class jio
    var that = {}, priv = {};
    spec = spec || {};
    // Attributes //
    var jio_id_array_name = 'jio/id_array';
    priv.id = null;

    priv.storage_spec = spec;

    // initialize //
    priv.init = function() {
        // Initialize the jio id and add the new id to the list
        if (priv.id === null) {
            var i, jio_id_a =
                LocalOrCookieStorage.getItem (jio_id_array_name) || [];
            priv.id = 1;
            for (i = 0; i < jio_id_a.length; i+= 1) {
                if (jio_id_a[i] >= priv.id) {
                    priv.id = jio_id_a[i] + 1;
                }
            }
            jio_id_a.push(priv.id);
            LocalOrCookieStorage.setItem (jio_id_array_name,jio_id_a);
            activityUpdater.setId(priv.id);
            jobManager.setId(priv.id);
        }
    };

    // Methods //
    /**
     * Returns a storage from a storage description.
     * @method storage
     * @param  {object} spec The specifications.
     * @param  {object} my The protected object.
     * @param  {string} forcetype Force storage type
     * @return {object} The storage object.
     */
    Object.defineProperty(that,"storage",{
        configurable:false,enumerable:false,writable:false,value:
        function(spec, my, forcetype) {
            spec = spec || {};
            my = my || {};
            my.basicStorage = storage;
            my.storage = that.storage; // NOTE : or proxy storage
            var type = forcetype || spec.type || 'base';
            if (type === 'base') {
                return storage(spec, my);
            }
            if (!storage_type_object[type]) {
                throw invalidStorageType(
                    {type:type,message:'Storage does not exists.'});
            }
            return storage_type_object[type](spec, my);
        }
    });
    jobManager.storage = that.storage;

    Object.defineProperty(that,"start",{
        configurable:false,enumerable:false,writable:false,value:
        function() {
            priv.init();
            activityUpdater.start();
            jobManager.start();
        }
    });
    Object.defineProperty(that,"stop",{
        configurable:false,enumerable:false,writable:false,value:
        function() {
            jobManager.stop();
        }
    });
    Object.defineProperty(that,"close",{
        configurable:false,enumerable:false,writable:false,value:
        function() {
            activityUpdater.stop();
            jobManager.stop();
            priv.id = null;
        }
    });

    /**
     * Returns the jio id.
     * @method getId
     * @return {number} The jio id.
     */
    Object.defineProperty(that,"getId",{
        configurable:false,enumerable:false,writable:false,value:
        function() {
            return priv.id;
        }
    });

    /**
     * Returns the jio job rules object used by the job manager.
     * @method getJobRules
     * @return {object} The job rules object
     */
    Object.defineProperty(that,"getJobRules",{
        configurable:false,enumerable:false,writable:false,value:
        function() {
            return jobRules;
        }
    });

    /**
     * Checks if the storage description is valid or not.
     * @method validateStorageDescription
     * @param  {object} description The description object.
     * @return {boolean} true if ok, else false.
     */
    Object.defineProperty(that,"validateStorageDescription",{
        configurable:false,enumerable:false,writable:false,value:
        function(description) {
            return that.storage(description).isValid();
        }
    });

    Object.defineProperty(that,"getJobArray",{
        configurable:false,enumerable:false,writable:false,value:
        function () {
            return jobManager.serialized();
        }
    });

    priv.getParam = function (list,nodoc) {
        var param = {}, i = 0;
        if (!nodoc) {
            param.doc = list[i];
            i ++;
        }
        if (typeof list[i] === 'object') {
            param.options = list[i];
            i ++;
        } else {
            param.options = {};
        }
        param.callback = function (err,val){};
        param.success = function (val) {
            param.callback(undefined,val);
        };
        param.error = function (err) {
            param.callback(err,undefined);
        };
        if (typeof list[i] === 'function') {
            if (typeof list[i+1] === 'function') {
                param.success = list[i];
                param.error = list[i+1];
            } else {
                param.callback = list[i];
            }
        }
        return param;
    };

    priv.addJob = function (commandCreator,spec) {
        jobManager.addJob(
            job({storage:that.storage(priv.storage_spec),
                 command:commandCreator(spec)}));
    };

    /**
     * Post a document.
     * @method post
     * @param  {object} doc The document {"content":}.
     * @param  {object} options (optional) Contains some options:
     * - {number} max_retry The number max of retries, 0 = infinity.
     * - {boolean} revs Include revision history of the document.
     * - {boolean} revs_info Retreive the revisions.
     * - {boolean} conflicts Retreive the conflict list.
     * @param  {function} callback (optional) The callback(err,response).
     * @param  {function} error (optional) The callback on error, if this
     *     callback is given in parameter, "callback" is changed as "success",
     *     called on success.
     */
    Object.defineProperty(that,"post",{
        configurable:false,enumerable:false,writable:false,value:
        function() {
            var param = priv.getParam(arguments);
            param.options.max_retry = param.options.max_retry || 0;
            priv.addJob(postCommand,{
                doc:param.doc,
                options:param.options,
                callbacks:{success:param.success,error:param.error}
            });
        }
    });

    /**
     * Put a document.
     * @method put
     * @param  {object} doc The document {"_id":,"_rev":,"content":}.
     * @param  {object} options (optional) Contains some options:
     * - {number} max_retry The number max of retries, 0 = infinity.
     * - {boolean} revs Include revision history of the document.
     * - {boolean} revs_info Retreive the revisions.
     * - {boolean} conflicts Retreive the conflict list.
     * @param  {function} callback (optional) The callback(err,response).
     * @param  {function} error (optional) The callback on error, if this
     *     callback is given in parameter, "callback" is changed as "success",
     *     called on success.
     */
    Object.defineProperty(that,"put",{
        configurable:false,enumerable:false,writable:false,value:
        function() {
            var param = priv.getParam(arguments);
            param.options.max_retry = param.options.max_retry || 0;
            priv.addJob(putCommand,{
                doc:param.doc,
                options:param.options,
                callbacks:{success:param.success,error:param.error}
            });
        }
    });

    /**
     * Get a document.
     * @method get
     * @param  {string} docid The document id (the path).
     * @param  {object} options (optional) Contains some options:
     * - {number} max_retry The number max of retries, 0 = infinity.
     * - {boolean} metadata_only Load only document metadata.
     * - {string} rev The revision we want to get.
     * - {boolean} revs Include revision history of the document.
     * - {boolean} revs_info Include list of revisions, and their availability.
     * - {boolean} conflicts Include a list of conflicts.
     * @param  {function} callback (optional) The callback(err,response).
     * @param  {function} error (optional) The callback on error, if this
     *     callback is given in parameter, "callback" is changed as "success",
     *     called on success.
     */
    Object.defineProperty(that,"get",{
        configurable:false,enumerable:false,writable:false,value:
        function() {
            var param = priv.getParam(arguments);
            param.options.max_retry = param.options.max_retry || 3;
            param.options.metadata_only = (
                param.options.metadata_only !== undefined?
                    param.options.metadata_only:false);
            priv.addJob(getCommand,{
                docid:param.doc,
                options:param.options,
                callbacks:{success:param.success,error:param.error}
            });
        }
    });

    /**
     * Remove a document.
     * @method remove
     * @param  {object} doc The document {"_id":,"_rev":}.
     * @param  {object} options (optional) Contains some options:
     * - {number} max_retry The number max of retries, 0 = infinity.
     * - {boolean} revs Include revision history of the document.
     * - {boolean} revs_info Include list of revisions, and their availability.
     * - {boolean} conflicts Include a list of conflicts.
     * @param  {function} callback (optional) The callback(err,response).
     * @param  {function} error (optional) The callback on error, if this
     *     callback is given in parameter, "callback" is changed as "success",
     *     called on success.
     */
    Object.defineProperty(that,"remove",{
        configurable:false,enumerable:false,writable:false,value:
        function() {
            var param = priv.getParam(arguments);
            param.options.max_retry = param.options.max_retry || 0;
            priv.addJob(removeCommand,{
                doc:param.doc,
                options:param.options,
                callbacks:{success:param.success,error:param.error}
            });
        }
    });

    /**
     * Get a list of documents.
     * @method allDocs
     * @param  {object} options (optional) Contains some options:
     * - {number} max_retry The number max of retries, 0 = infinity.
     * - {boolean} metadata_only Load only document metadata
     * - {boolean} descending Reverse the order of the output table.
     * - {boolean} revs Include revision history of the document.
     * - {boolean} revs_info Include revisions.
     * - {boolean} conflicts Include conflicts.
     * @param  {function} callback (optional) The callback(err,response).
     * @param  {function} error (optional) The callback on error, if this
     *     callback is given in parameter, "callback" is changed as "success",
     *     called on success.
     */
    Object.defineProperty(that,"allDocs",{
        configurable:false,enumerable:false,writable:false,value:
        function() {
            var param = priv.getParam(arguments,'no doc');
            param.options.max_retry = param.options.max_retry || 3;
            param.options.metadata_only = (
                param.options.metadata_only !== undefined?
                    param.options.metadata_only:true);
            priv.addJob(allDocsCommand,{
                options:param.options,
                callbacks:{success:param.success,error:param.error}
            });
        }
    });

    return that;
};                              // End Class jio
