var w = 960,
    h = 800;

var tree = d3.layout.tree()
    .size([w-100, h-160])
    .sort(
        function(a,b) {
            return d3.ascending(a.id, b.id);
        }
    );

var diagonal = d3.svg.diagonal();

var vis = d3.select("#chart").append("svg")
    .attr("width", w)
    .attr("height", h)
  .append("g")
    .attr("transform", "translate(0, 50)");

var duration = 500, short_duration = 100;
var refresh_time = 1000;


// Selection settings, methods, and initial setup
var selected_node = undefined;

var setSelection = function(v) {
    selected_node = v;
    if (selected_node === undefined) {
        $('#disconnect-button').attr('disabled', 'true');
    }
    else {
        $('#disconnect-button').removeAttr('disabled');
    }
};

var node_color_interpolator = d3.interpolateRgb("lightsteelblue", "green");
var node_cut_scale = d3.scale.linear().domain([0, 2]);
var node_color = function(d, i) {
    // A bunch of special cases
    if (d.hovering)
        return "orange";

    if (d.id == selected_node)
        return "red";

    if (d.cuts === undefined)
        return "lightsteelblue";

    // And then choose color based on number of cuts
    return node_color_interpolator(node_cut_scale(d.cuts));
};

$(document).ready(
    function() {
        // Disable selection when clicking on something besides
        $('body').click(function() { setSelection(undefined); });
        //$('#chart').click(function() { setSelection(undefined); });
        // Disconnect button
        $('#disconnect-button').click(
            function() {
                $.ajax(disconnect_url.replace("OBJID", selected_node));
            }
        );
        // Initialize selection to get UI right
        setSelection();
    }
);


// We need to carefully handle the layout of our data for d3 in order
// to properly handle changes to the tree. We want to make sure we
// keep nodes with the same identifiers associated with each other. We
// keep a map of objects by identifier, and then also have the in the
// tree structure, which we then modify on each update
var nodes_by_id = {};

var update_tree = function (new_data) {
    // Setup last_parent relationship before we start mucking with the
    // state of the data
    for(var idx in nodes_by_id) {
        var node = nodes_by_id[idx];
        node.last_parent = node.parent;
        node.fresh = false;
    }
    // First pass clears out old relationships, makes sure we have a
    // new list of nodes by id.
    var new_nodes_by_id = {};
    var new_roots = [];
    for(var idx in new_data) {
        var x = new_data[idx];
        var node;
        if (x.id in nodes_by_id) {
            node = nodes_by_id[x.id];
            // Update the existing nodes basic data
            node.bounds = x.bounds;
            node.cuts = x.cuts;
            node.parent = x.parent;
            // Children get cleared out. They'll be filled back in below.
            node.children = [];
        }
        else {
            node = x;
            node.fresh = true;
        }
        if (!node.parent || node.parent ==
            '00000000-0000-0000-0000-000000000000') {
            delete node.parent;
            new_roots.push(node);
        }
        new_nodes_by_id[node.id] = node;
    }

    // Now, all references should be available in the new list of
    // nodes, so we can build an updated tree which uses the same
    // nodes
    for(idx in new_data) {
        var x = new_data[idx];
        var node = new_nodes_by_id[x.id];
        if (node.parent) {
            var parent = new_nodes_by_id[node.parent];
            if (!parent.children) parent.children = [];
            parent.children.push(node);
        }
    }

    // And we don't need to do anything with the old nodes, they'll
    // just fall out naturally.

    // For now, just return one new root. Two roots shouldn't be
    // common anyway.
    nodes_by_id = new_nodes_by_id;
    return new_roots[0];
};

var translate_to_my_target_position = function(d) {
    // Save for other nodes to reference in the next iteration
    d.x_prev = d.x; d.y_prev = d.y;
    return "translate(" + d.x + "," + d.y + ")";
};
var get_existing_ancestor_or_self = function(d) {
    var anc = d;
    while (anc && anc.fresh && anc.parent)
        anc = anc.parent;
    return anc;
};
var get_existing_ancestor = function(d) {
    return get_existing_ancestor_or_self(d.parent);
};
var translate_to_existing_ancestor_position = function(d) {
    var anc = get_existing_ancestor(d);
    if (!anc) anc = d;
    // Save for other nodes to reference in the next iteration
    d.x_prev = x.x; d.y_prev = d.y;
    return "translate(" + anc.x + "," + anc.y + ")";
};
var translate_to_existing_ancestor_prev_position = function(d) {
    var anc = get_existing_ancestor(d);
    // If we can't find a proper ancestor, just put us directly in
    // place.
    var x, y;
    if (!anc) {
        x = d.x; y = d.y;
    }
    else {
        x = anc.x_prev; y = anc.y_prev;
    }
    // Save for other nodes to reference in the next iteration
    d.x_prev = x; d.y_prev = y;
    return "translate(" + x + "," + y + ")";
};
var translate_to_last_parent_position = function(d) {
    var target = d;
    if (d.last_parent)
        target = d.last_parent;
    // Save for other nodes to reference in the next iteration
    d.x_prev = target.x; d.y_prev = target.y;
    return "translate(" + target.x + "," + target.y + ")";
};
var last_valid_ancestor = function(d) {
    var target = d;
    while(target.last_parent) {
        // children is an array, we need to manually search for the item
        var found = false;
        for(var x in target.last_parent.children) {
            if (target.last_parent.children[x].id == target.id) {
                found = true;
                break;
            }
        }
        if (found) break;
        target = target.last_parent;
    }
    return target;
};
var translate_to_last_valid_ancestor_position = function(d) {
    var target = last_valid_ancestor(d);
    // Save for other nodes to reference in the next iteration
    d.x_prev = target.x; d.y_prev = target.y;
    return "translate(" + target.x + "," + target.y + ")";
};

var vec3_str = function(v) {
    return '(' + v.x + ', ' + v.y + ', ' + v.z + ')';
};
var bounds_str = function(d) {
    return 'c = ' + vec3_str(d.bounds.center) + ', r = ' + d.bounds.radius;
};

var node_color_func = function(v) {
    v
        .style("fill", node_color)
        .style("stroke", node_color);
};
var node_hover_func = function(d, i) {
    var g = d3.select(this);
    g.selectAll("circle")
        .each( function(d,i) { d.hovering = true; } )
        .call(node_color_func);
    $('#selected-node-id').text(d.id);
    $('#selected-node-center').text(vec3_str(d.bounds.center));
    $('#selected-node-radius').text(d.bounds.radius);
    $('#selected-node-cuts').text(d.cuts);
};

var node_unhover_func = function(d, i) {
    var g = d3.select(this);
    g.selectAll("circle")
        .each( function(d,i) { delete d.hovering; } )
        .transition().duration(duration)
        .style("fill", node_color(d))
        .style("stroke", node_color(d));
};

var node_click_func = function(d, i) {
    setSelection(d.id);
    d3.event.stopPropagation();
};

var update_data = function () {
  d3.json(
      data_url,
      function(json) {
          var root = update_tree(json);
          var nodes = tree.nodes(root);


          // Update the links first, to ensure they're below the nodes
          var link = vis.selectAll("path.link")
              .data(tree.links(nodes), function(d) { return d.target.id; });

          // Enter any new links at an existing ancestors previous
          // position so these "grow" out of an existing node.
          link.enter().insert("path", "g")
              .attr("class", "link")
              .attr("d", function(d) {
                  var anc = get_existing_ancestor_or_self(d.target);
                  var o;
                  // If we don't have an ancestor, just grow out of
                  // our source's position.
                  if (!anc) {
                      if ('prev_x' in d.source)
                          o = {x : d.source.prev_x, y: d.source.prev_y };
                      else
                          o = {x : d.source.x, y: d.source.y };
                  }
                  else {
                      o = {x: anc.x_prev, y: anc.y_prev};
                  }
                  return diagonal({source: o, target: o});
              });

          // Transition links to their new position.
          link.transition()
              .duration(duration)
              .attr("d", diagonal);

          // Links exit by shrinking into the nearest valid ancestor.
          link.exit()
              .transition().duration(duration)
              .attr("d", function(d) {
                  var anc = last_valid_ancestor(d.target);
                  var o = {x: anc.x, y: anc.y};
                  return diagonal({source: o, target: o});
              })
              .remove();



          // Now update nodes...
          var node = vis.selectAll("g.node")
              .data(nodes, function(d) { return d.id; });

          // New nodes start at the previous position of the nearest
          // ancestor that already existed and transition to their new
          // position. This makes new children/subtrees "grow" out of
          // an existing node.
          var new_node = node.enter().append("g");
          new_node
              .attr("class", "node")
              .attr("transform", translate_to_existing_ancestor_prev_position)
              .on("mouseover", node_hover_func)
              .on("mouseout", node_unhover_func)
              .on("click", node_click_func)
              .transition().duration(duration)
              .attr("transform", translate_to_my_target_position);
          // And each gets a circle
          new_node.append("circle")
              .attr("r", 0)
              .transition().duration(duration)
              .attr("r", 5);

          // All nodes transition into their new position, color
          node
              .transition().duration(duration)
              .attr("transform", translate_to_my_target_position);
          node.selectAll("circle")
              .call(node_color_func);

          // Exiting nodes shrink their circles, moving into the
          // nearest valid ancestors. This makes subtrees shrink/fade
          // into their root that continues to exist.
          var exit_node = node.exit();
          exit_node.selectAll("circle")
              .transition().duration(duration)
              .attr("r", 0);
          exit_node
              .transition().duration(duration)
              .attr("transform", translate_to_last_valid_ancestor_position)
              .remove();
      }
  );
};
update_data();
window.setInterval(update_data, refresh_time);
