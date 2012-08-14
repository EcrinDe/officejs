var command = function(spec, my) {
    var that = {};
    spec = spec || {};
    my = my || {};
    // Attributes //
    var priv = {};
    priv.commandlist = {'post':postCommand,
                        'put':putCommand,
                        'get':getCommand,
                        'remove':removeCommand,
                        'allDocs':allDocsCommand};
    // creates the good command thanks to his label
    if (spec.label && priv.commandlist[spec.label]) {
        priv.label = spec.label;
        delete spec.label;
        return priv.commandlist[priv.label](spec, my);
    }

    priv.tried     = 0;
    priv.doc       = spec.doc || {};
    priv.docid     = spec.docid || '';
    priv.option    = spec.options || {};
    priv.callbacks = spec.callbacks || {};
    priv.success   = priv.callbacks.success || function (){};
    priv.error     = priv.callbacks.error || function (){};
    priv.retry     = function() {
        that.error({
            status:13,statusText:'Fail Retry',error:'fail_retry',
            message:'Impossible to retry.',reason:'Impossible to retry.'
        });
    };
    priv.end       = function() {};
    priv.on_going  = false;

    // Methods //
    /**
     * Returns a serialized version of this command.
     * Override this function.
     * @method serialized
     * @return {object} The serialized command.
     */
    that.serialized = function() {
        return {label:that.getLabel(),
                tried:priv.tried,
                doc:that.cloneDoc(),
                option:that.cloneOption()};
    };

    /**
     * Returns the label of the command.
     * @method getLabel
     * @return {string} The label.
     */
    that.getLabel = function() {
        return 'command';
    };

    that.getDocId = function () {
        return priv.docid || priv.doc._id;
    };
    that.getDocContent = function () {
        return priv.doc.content;
    };

    /**
     * Returns an information about the document.
     * @method getDocInfo
     * @param  {string} infoname The info name.
     * @return The info value.
     */
    that.getDocInfo = function (infoname) {
        return priv.doc[infoname];
    };

    /**
     * Returns the value of an option.
     * @method getOption
     * @param  {string} optionname The option name.
     * @return The option value.
     */
    that.getOption = function (optionname) {
        return priv.option[optionname];
    };

    /**
     * Validates the storage.
     * @param  {object} storage The storage.
     */
    that.validate = function (storage) {
        if (!that.validateState()) { return false; }
        return storage.validate();
    };

    /*
     * Extend this function
     */
    that.validateState = function() {
        if (typeof priv.doc !== 'object') {
            that.error({
                status:20,
                statusText:'Document_Id Required',
                error:'document_id_required',
                message:'No document id.',
                reason:'no document id'
            });
            return false;
        }
        return true;
    };

    that.canBeRetried = function () {
        return (typeof priv.option.max_retry === 'undefined' ||
                priv.option.max_retry === 0 ||
                priv.tried < priv.option.max_retry);
    };
    that.getTried = function() {
        return priv.tried;
    };

    /**
     * Delegate actual excecution the storage.
     * @param {object} storage The storage.
     */
    that.execute = function(storage) {
        if (!priv.on_going) {
            if (that.validate (storage)) {
                priv.tried ++;
                priv.on_going = true;
                storage.execute (that);
            }
        }
    };

    /**
     * Execute the good method from the storage.
     * Override this function.
     * @method executeOn
     * @param  {object} storage The storage.
     */
    that.executeOn = function(storage) {};

    that.success = function(return_value) {
        priv.on_going = false;
        priv.success (return_value);
        priv.end(doneStatus());
    };

    that.retry = function (return_error) {
        priv.on_going = false;
        if (that.canBeRetried()) {
            priv.retry();
        } else {
            that.error (return_error);
        }
    };

    that.error = function(return_error) {
        priv.on_going = false;
        priv.error(return_error);
        priv.end(failStatus());
    };

    that.end = function () {
        priv.end(doneStatus());
    };

    that.onSuccessDo = function (fun) {
        if (fun) {
            priv.success = fun;
        } else {
            return priv.success;
        }
    };

    that.onErrorDo = function (fun) {
        if (fun) {
            priv.error = fun;
        } else {
            return priv.error;
        }
    };

    that.onEndDo = function (fun) {
        priv.end = fun;
    };

    that.onRetryDo = function (fun) {
        priv.retry = fun;
    };

    /**
     * Is the command can be restored by another JIO : yes.
     * @method canBeRestored
     * @return {boolean} true
     */
    that.canBeRestored = function() {
        return true;
    };

    /**
     * Clones the command and returns it.
     * @method clone
     * @return {object} The cloned command.
     */
    that.clone = function () {
        return command(that.serialized(), my);
    };

    /**
     * Clones the command options and returns the clone version.
     * @method cloneOption
     * @return {object} The clone of the command options.
     */
    that.cloneOption = function () {
        var k, o = {};
        for (k in priv.option) {
            o[k] = priv.option[k];
        }
        return o;
    };

    /**
     * Clones the document and returns the clone version.
     * @method cloneDoc
     * @return {object} The clone of the document.
     */
    that.cloneDoc = function () {
        if (priv.docid) {
            return priv.docid;
        }
        var k, o = {};
        for (k in priv.doc) {
            o[k] = priv.doc[k];
        }
        return o;
    };

    return that;
};
