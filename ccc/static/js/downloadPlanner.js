
CIRCLE_RADIUS = 10;
DOWNLOAD_CIRCLE_RADIUS = 7;
CIRCLE_PADDING = 25;

LEFT_COLUMN_START_X = 20;
LEFT_COLUMN_START_Y = 20;

LOADED_OBJECT_COLOR   = 'orange';
WAITING_OBJECT_COLOR  = 'red';

LOADED_ASSETS_COLOR   = 'blue';
WAITING_ASSETS_COLOR  = 'brown';

//DEFAULT_LINE_CONNECTOR_COLOR = '#b8aeae';
DEFAULT_LINE_CONNECTOR_COLOR = 'gray';
DEFAULT_LINE_CONNECTOR_WIDTH = '.5px';
SELECTED_LINE_CONNECTOR_COLOR = 'black';
SELECTED_LINE_CONNECTOR_WIDTH = '1.5px';

ADDED_OBJECT_COLOR = 'green';
REMOVED_OBJECT_COLOR = 'red';

NEWLY_LOADED_ASSET_COLOR = 'blue';
ADDED_ASSET_COLOR = 'green';
REMOVED_ASSET_COLOR = 'red';

HEIGHT = 28000;
WIDTH  = 3000;



LOADED_ASSET_PRIORITY = 100;


diffObject = null;
allDataVec = [];

function onReady()
{
    setupTime = new Date();
    
    var svg = d3.select("#dataDispDiv").append("svg:svg")
        .attr("width", WIDTH) 
        .attr("height", HEIGHT);

    $('#getMoreDataButton').click(
        function()
        {
            requestData(svg);
        });
    requestData(svg);


    $('#diffButton').click(
        function()
        {
            var lowerVal = parseInt($('#initial').val());
            var upperVal = parseInt($('#compareTo').val());
            if ((isNaN(lowerVal)) || (lowerVal < 0))
            {
                alert('Invalid lower val entered');
                return;
            }
            else if ((isNaN(upperVal)) || (upperVal >= allDataVec.length))
            {
                alert('Invalid upper val entered');
                return;                
            }

            var lowerData = allDataVec[lowerVal];
            var upperData = allDataVec[upperVal];

            if (diffObject !== null)
                diffObject.blank();

            diffObject = upperData.diff(lowerData);
            diffObject.printSummary(svg);
        });
}

function requestData(svg)
{
    $.ajax({
               url: TO_QUERY,
               type: "GET",
               success: function (data)
               {
                   processNewData(svg,data);
               }
           });
}


function processNewData(svg,data)
{
    var dataTime = new Date();
    var timeDiffInSeconds = (dataTime - setupTime)/1000.0;
    var sData = new SingleRunData(data,svg);
    sData.blank();
    allDataVec.push(sData);

    var dataId = allDataVec.length;
    var newDivId = 'data_select_' + dataId.toString();
    var htmlToDisplay = '<div id="' + newDivId +'">';
    htmlToDisplay += '<b>' + (dataId-1).toString() + '</b>';
    htmlToDisplay += '  Click here to display data collected ';
    htmlToDisplay += timeDiffInSeconds.toString() + 's after ';
    htmlToDisplay += 'started.';
    htmlToDisplay += '</div>';
    
    $('#selectDataDiv').append(htmlToDisplay);
    $('#'+newDivId).click(
        function()
        {
            for (var s in allDataVec)
                allDataVec[s].blank();

            if (diffObject !== null)
                diffObject.blank();
            
            allDataVec[dataId-1].drawData();
        });
}




function SingleRunData(allData,svg)
{
    var assets = allData['ddplanner']['assets'];
    var loadedObjects = allData['ddplanner']['loaded_objects'];
    var waitingObjects = allData['ddplanner']['waiting_objects'];


    var sortedObjects = preConditionObjects(loadedObjects,waitingObjects);
    this.objIdsToObjects = drawObjects(
        svg,sortedObjects,LOADED_OBJECT_COLOR,WAITING_OBJECT_COLOR);

    //now draw assets
    var sortedAssets = sortAssets(assets);
    this.assetIdsToAssets = drawAssets(
        svg,sortedAssets,LOADED_ASSETS_COLOR,
        WAITING_ASSETS_COLOR,this.objIdsToObjects);

    //actually draw connections between assets and objects
    drawLines(this.assetIdsToAssets);

//    this.blank();

}

SingleRunData.prototype.blank = function()
{
    for (var s in this.assetIdsToAssets)
        this.assetIdsToAssets[s].blank();
    for (var t in this.objIdsToObjects)
        this.objIdsToObjects[t].blank();
};

SingleRunData.prototype.drawData = function()
{
    for (var s in this.assetIdsToAssets)
        this.assetIdsToAssets[s].drawData();
    for (var t in this.objIdsToObjects)
        this.objIdsToObjects[t].drawData();
};



SingleRunData.prototype.diff = function(olderSingleRun)
{
    return new DiffObject(this,olderSingleRun);
};


function DiffObject(newerSingleRun,olderSingleRun)
{
    //get object differences
    this.addedObjects = {};
    this.removedObjects = {};
    
    for (var s in newerSingleRun.objIdsToObjects)
    {
        if (!(s in olderSingleRun.objIdsToObjects))
            this.addedObjects[s] = newerSingleRun.objIdsToObjects[s];
    }
    for (var s in olderSingleRun.objIdsToObjects)
    {
        if (!(s in newerSingleRun.objIdsToObjects))
            this.removedObjects[s] = olderSingleRun.objIdsToObjects[s];            
    }

    //get asset differences
    this.addedAssets       = {};
    this.removedAssets     = {};
    this.newlyLoadedAssets = {};
    
    //went from downloading to loaded
    //went from 
    for (var s in newerSingleRun.assetIdsToAssets)
    {
        if (!(s in olderSingleRun.assetIdsToAssets))
        {
            this.addedAssets[s] = newerSingleRun.assetIdsToAssets[s];
            if (newerSingleRun.assetIdsToAssets[s].toDownloadCircle === null)
                this.newlyLoadedAssets[s] = newerSingleRun.assetIdsToAssets[s];
        }
        else
        {
            if ((newerSingleRun.assetIdsToAssets[s].toDownloadCircle === null) &&
                (olderSingleRun.assetIdsToAssets[s].toDownloadCircle !== null))
            {
                this.newlyLoadedAssets[s] = newerSingleRun.assetIdsToAssets[s];                    
            }
        }
    }

    for (var t in olderSingleRun.assetIdsToAssets)
    {
        if (!(s in newerSingleRun.assetIdsToAssets))
            this.removedAssets[s] = olderSingleRun.assetIdsToAssets[s];
    }
    this.allText = [];
}

DiffObject.prototype.blank = function()
{
    for (var s in this.allText)
        this.allText[s].style('opacity',0);
};

DiffObject.prototype.printSummary =function(svg)
{
    //paint added and removed objects
    var numInLeftColumn = 0;
    for (var s in this.addedObjects)
    {
        var addedTextString = '+ ' + priorityStringFormat(this.addedObjects[s].priority.toString()) +
            '     ' + objId(s);

        
        var addedText = svg.append('text')
            .attr("x", LEFT_COLUMN_START_X )
            .attr("y", LEFT_COLUMN_START_Y + numInLeftColumn* CIRCLE_PADDING)
            .text(addedTextString)
            .attr('fill',ADDED_OBJECT_COLOR);

        this.allText.push(addedText);
        ++numInLeftColumn;
    }


    for (var s in this.removedObjects)
    {
        var removedTextString = '- ' +  priorityStringFormat(this.removedObjects[s].priority.toString()) +
            '   ' + objId(s);


        var removedText = svg.append('text')
            .attr("x", LEFT_COLUMN_START_X )
            .attr("y", LEFT_COLUMN_START_Y + numInLeftColumn* CIRCLE_PADDING)
            .text(removedTextString)
            .attr('fill',REMOVED_OBJECT_COLOR);

        this.allText.push(removedText);
        ++numInLeftColumn;
    }

    //now assets.  
    var numInRightColumn = 0;
    for (var s in this.newlyLoadedAssets)
    {
        var loadedTextString = 'LOADED ' + s;
        var loadedText = svg.append('text')
            .attr("x", LEFT_COLUMN_START_X + 500)
            .attr("y", LEFT_COLUMN_START_Y + numInRightColumn* CIRCLE_PADDING)
            .text(loadedTextString)
            .attr('fill',NEWLY_LOADED_ASSET_COLOR);
        
        this.allText.push(loadedText);
        ++numInRightColumn;
    }


    for (var s in this.addedAssets)
    {
        var addedTextString = '+ ' +  priorityStringFormat(this.addedAssets[s].priority.toString()) +
            '   ' + s;

        
        var addedText = svg.append('text')
            .attr("x", LEFT_COLUMN_START_X + 500)
            .attr("y", LEFT_COLUMN_START_Y + numInRightColumn* CIRCLE_PADDING)
            .text(addedTextString)
            .attr('fill',ADDED_ASSET_COLOR);
        
        this.allText.push(addedText);
        ++numInRightColumn;
    }

    for (var s in this.removedAssets)
    {
        var removedTextString = '+ ' + priorityStringFormat(this.removedAssets[s].priority.toString()) +
            '   ' + s;
        
        var removedText = svg.append('text')
            .attr("x", LEFT_COLUMN_START_X + 500)
            .attr("y", LEFT_COLUMN_START_Y + numInRightColumn* CIRCLE_PADDING)
            .text(removedTextString)
            .attr('fill',REMOVED_ASSET_COLOR);
        
        this.allText.push(removedText);
        ++numInRightColumn;
    }    
        
};





function drawLines(assets)
{
    for (var s in assets)
        assets[s].drawLines();
}



/**
 Draws the circles for each asset, its name, and the resources that
 it still must download.
 
 Returns a map of asset names (uri-s) to asset objects.
 */
function drawAssets(svg,sortedAssets,loadedColor,waitingColor,objIdsToObjects)
{
    var toReturn = {};
    var numInRightColumn = 1; 
    for (var s in sortedAssets)
    {
        var isLoaded = sortedAssets[s].stillToDownload === 0;

        var cx = LEFT_COLUMN_START_X + 480;
        var cy = LEFT_COLUMN_START_Y + numInRightColumn*CIRCLE_PADDING;
        
        var circle = svg.append("circle")
            .attr("r", CIRCLE_RADIUS)
            .attr("cx", cx)
            .attr("cy", cy)
            .attr("fill", isLoaded ? loadedColor : waitingColor);



        //print priority text
        var priorityTextString = 'LOADED';
        if (sortedAssets[s].priority != LOADED_ASSET_PRIORITY)
            priorityTextString = sortedAssets[s].priority.toString().substring(0,7);
        var priorityText = svg.append('text')
            .attr("x", LEFT_COLUMN_START_X + 500)
            .attr("y", LEFT_COLUMN_START_Y + numInRightColumn*CIRCLE_PADDING + 5)
            .text(priorityTextString);



        var text = svg.append('text')
            .attr("x", LEFT_COLUMN_START_X + 590)
            .attr("y", LEFT_COLUMN_START_Y + numInRightColumn*CIRCLE_PADDING + 5)
            .text(sortedAssets[s].name);
        
        //toReturn[sortedAssets[s].name] = circle;

        ++numInRightColumn;

        //draw circles for loaded and unloaded
        var loadedX = cx + 10;
        var toDownloadCircle = null;
        var toDownloadText = null;
        if (! isLoaded)
        {
            // //means that we draw the unloaded circle  
            toDownloadCircle = svg.append("circle")
                .attr("r", DOWNLOAD_CIRCLE_RADIUS)
                .attr("cx", cx + 10)
                .attr("cy", cy + CIRCLE_PADDING)
                .attr("fill",  waitingColor)
                .on('click',(function(s)
                     {
                         return function()
                         {
                             alert('I do not do anything right now.');
                         };
                     })(s));

            var toDownloadText_x = cx + 18;
            
            toDownloadText = svg.append('text')
                .attr("x", toDownloadText_x)
                .attr("y", cy + CIRCLE_PADDING + 7)
                .text(sortedAssets[s].stillToDownload.toString());

            loadedX = toDownloadText_x + 30;
        }

        //draw the number of loaded items
        var dlCirc_x = loadedX + 10;
        var dlCirc_y = cy + CIRCLE_PADDING;
        var downloadedCircle = svg.append('circle')
            .attr("r", DOWNLOAD_CIRCLE_RADIUS)
            .attr("cx", dlCirc_x)
            .attr("cy", dlCirc_y)
            .attr("fill",  loadedColor);
        downloadedCircle.on('click',
                          (function(s)
                          {
                              return function()
                              {
                                  var alertText = '';
                                  for (var t in sortedAssets[s].loadedResources)
                                      alertText += sortedAssets[s].loadedResources[t] + '\n\n';
                                  alert(alertText);
                              };
                          })(s));



        var downloadedText = svg.append('text')
            .attr("x", dlCirc_x + 8)
            .attr("y", dlCirc_y +7)
            .text(sortedAssets[s].loadedResources.length.toString());

        //increment column so that go to next line.
        ++numInRightColumn;

        var asset =
            new Asset(sortedAssets[s],circle,priorityText,text,
                      toDownloadCircle,toDownloadText,downloadedCircle,
                      downloadedText,objIdsToObjects,svg);
        toReturn[asset.id] = asset;
        var clickFunction =    (function(which)
                                {
                                    return function()
                                    {
                                        toReturn[which].select();
                                    };
                                })(asset.id);

        circle.on('click',clickFunction);


        
    }
    return toReturn;
}

/** 
 Contains a reduced version of the data returned on each asset
 from the server as well as pointers to other data that make
 selecting the asset and drawing its connections easier.

 Makes connections darker when clicked on.
 */
function Asset(asset,circle,priorityText,text,toDownloadCircle,
               toDownloadText,downloadedCircle,downloadedText,
               objIdsToObjects,svg)
{
    this.id = asset.name;
    this.priority = asset.priority;
    this.isSelected = false;
    this.svg = svg;
    
    this.objIds = [];
    for (var s in asset.usingObjects)
        this.objIds.push(objId(asset.usingObjects[s]));

    for (var s in asset.waitingObjects)
        this.objIds.push(objId(asset.waitingObjects[s]));
    
    
    this.circle = circle;
    this.priorityText = priorityText;
    this.text = text;
    this.toDownloadCircle = toDownloadCircle;
    this.toDownloadText = toDownloadText;
    this.downloadedCircle = downloadedCircle;
    this.downloadedText = downloadedText;
    
    this.objIdsToObjects = objIdsToObjects;
    this.allLines = [];
    this.amBlank = false;
}



Asset.prototype.drawData = function()
{
    this.amBlank = false;

    this.circle.style('opacity',1);

    
    this.priorityText.style('opacity',1);
    this.text.style('opacity',1);
    if (this.toDownloadCircle !== null)
    {
        this.toDownloadCircle.style('opacity',1);
        this.toDownloadText.style('opacity',1);            
    }
    this.downloadedCircle.style('opacity',1);
    this.downloadedText.style('opacity',1);

    for (var s in this.allLines)
        this.allLines[s].style('opacity',1);


};

Asset.prototype.blank = function()
{
    this.amBlank = true;
    
    this.circle.style('opacity',0);
    this.priorityText.style('opacity',0);
    this.text.style('opacity',0);
    if (this.toDownloadCircle !== null)
    {
        this.toDownloadCircle.style('opacity',0);
        this.toDownloadText.style('opacity',0);            
    }
    this.downloadedCircle.style('opacity',0);
    this.downloadedText.style('opacity',0);

    for (var s in this.allLines)
        this.allLines[s].style('opacity',0);

};

Asset.prototype.drawLines = function()
{
    
    var circleX = this.circle.attr('cx');
    var circleY = this.circle.attr('cy');
    for (var s in this.objIds)
    {
        var objId = this.objIds[s];
        var endCircleX = this.objIdsToObjects[objId].circle.attr('cx');
        var endCircleY = this.objIdsToObjects[objId].circle.attr('cy');

        var line = this.svg.append('svg:line')
            .attr('x1',circleX)
            .attr('y1',circleY)
            .attr('x2',endCircleX)
            .attr('y2',endCircleY)
            .attr('stroke',DEFAULT_LINE_CONNECTOR_COLOR)
            .attr('stroke-width',DEFAULT_LINE_CONNECTOR_WIDTH);

        this.allLines.push(line);
    }

};

Asset.prototype.select = function()
{
    if (this.amBlank)
        return;
    
    this.isSelected = ! this.isSelected;
    
    var lineColor   = DEFAULT_LINE_CONNECTOR_COLOR;
    var strokeWidth = DEFAULT_LINE_CONNECTOR_WIDTH;
    if (this.isSelected)
    {
        lineColor = SELECTED_LINE_CONNECTOR_COLOR;
        strokeWidth = SELECTED_LINE_CONNECTOR_WIDTH;
    }


    for (var s in this.allLines)
    {
        this.allLines[s].attr('stroke',lineColor)
            .attr('stroke-width',strokeWidth);
    }
};
//////////////////////////////


/**
 sort assets in decreasing order of priority. For assets that
 were already loaded (have priority of -1), replace their
 priorities with something large so that they appear at the
 beginning of the sorted array.
 */
function sortAssets(allAssets)
{
    
    var toReturn = [];
    for (var s in allAssets)
    {
        if (allAssets[s].priority == -1)
            allAssets[s].priority = LOADED_ASSET_PRIORITY;
        toReturn.push(
            allAssets[s]);
    }
    toReturn.sort(
        function(a,b)
        {
           return b.priority - a.priority;
        });
    return toReturn;
}


function SortedObjElement(id,priority,loaded)
{
    this.id       = id;
    this.priority = priority;
    this.loaded   = loaded;
}

/**
 Returns an object containing both sorted and unsorted objects,
 sorted by priority weight.
 */
function preConditionObjects(loadedObjects,waitingObjects)
{
    var allObjs = {};

    for (var s in loadedObjects)
    {
        loadedObjects[s].loaded = true;
        allObjs[s]= loadedObjects[s];
    }

    for (var t in waitingObjects)
    {
        waitingObjects[t].loaded = false;
        allObjs[t] = waitingObjects[t];
    }


    return sortObjects(allObjs);
}

//returns an array with elements SortedObjElement....most 
function sortObjects(objsToSort)
{
    var toReturn = [];
    for (var s in objsToSort)
    {
        toReturn.push(
            new SortedObjElement(s,objsToSort[s]['priority'],
                                 objsToSort[s]['loaded']));
    }
    toReturn.sort(
        function(a,b)
        {
           return b.priority - a.priority;
        });
        return toReturn;
}


function Object(id,text,priorityText,circle,priority,loaded)
{
    this.id = id;
    
    this.text = text;
    this.priorityText = priorityText;
    this.circle = circle;
    this.priority = priority;
    this.loaded = loaded;
}

Object.prototype.drawData = function()
{
    this.text.style('opacity',1);
    this.circle.style('opacity',1);
    this.priorityText.style('opacity',1);
};




Object.prototype.blank = function()
{
    this.text.style('opacity',0);
    this.circle.style('opacity',0);
    this.priorityText.style('opacity',0);
};

function drawObjects(svg,objectsToDraw,loadedColor,waitingColor)
{
    var objIdsToObjects = {};

    var numInLeftColumn = 1;


    for (var s in objectsToDraw)
    {
        var text = svg.append("text")
            .attr("x", LEFT_COLUMN_START_X)
            .attr("y", LEFT_COLUMN_START_Y + numInLeftColumn*CIRCLE_PADDING + 5)
            .text(objId(objectsToDraw[s]['id']));

        var priorityText = svg.append("text")
            .attr("x", LEFT_COLUMN_START_X + 80)
            .attr("y", LEFT_COLUMN_START_Y + numInLeftColumn*CIRCLE_PADDING + 5)
            .text(priorityStringFormat(objectsToDraw[s]['priority'].toString()));
        
        var circle = svg.append("circle")
            .attr("r", CIRCLE_RADIUS)
            .attr("cx", LEFT_COLUMN_START_X + 180)
            .attr("cy", LEFT_COLUMN_START_Y + numInLeftColumn*CIRCLE_PADDING)
            .attr("fill", objectsToDraw[s].loaded ? loadedColor : waitingColor)
            .on('click',function(){alert('hi');});


        objIdsToObjects[objId(objectsToDraw[s].id)] =
            new Object(objectsToDraw[s].id,text,priorityText,
                       circle,objectsToDraw[s]['priority'],objectsToDraw[s].loaded);
                       
        ++numInLeftColumn;
    }

    return objIdsToObjects;
}


function priorityStringFormat(priority)
{
    return priority.toString().substr(0,9);
}

function objId(str)
{
    return str.substr(0,7);
}

