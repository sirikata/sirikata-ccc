var w = 960,
    h = 800;

var tree = d3.layout.tree()
    .size([w-100, h-160]);

var diagonal = d3.svg.diagonal();

var vis = d3.select("#chart").append("svg")
    .attr("width", w)
    .attr("height", h)
  .append("g")
    .attr("transform", "translate(0, 50)");

var duration = 500;
var refresh_time = 1000;

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

var bounds_str = function(d) {
    return 'c = (' + d.bounds.center.x + ', ' + d.bounds.center.y + ', ' + d.bounds.center.z + '), r = ' + d.bounds.radius;
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
              .on("mouseover", function(d, i) {
                  var g = d3.select(this);
                  g.selectAll("circle")
                      .transition().duration(duration)
                      .style("fill", "orange")
                      .style("stroke", "orange");
                  g.append("text")
                      .attr("class", "info-overlay")
                      .text(function(d) { return d.id + '  ' + bounds_str(d); })
                      .style("opacity", 0)
                      .transition().duration(duration)
                      .style("opacity", 1)
                  ;
              })
              .on("mouseout", function(d, i) {
                  var g = d3.select(this);
                  g.selectAll("circle")
                      .transition().duration(duration)
                      .style("fill", "lightsteelblue")
                      .style("stroke", "lightsteelblue");
                  g.selectAll(".info-overlay")
                      .transition().duration(duration)
                      .style("opacity", 0);
//                      .remove();
              })
              .transition().duration(duration)
              .attr("transform", translate_to_my_target_position);
          // And each gets a circle
          new_node.append("circle")
              .attr("r", 0)
              .transition().duration(duration)
              .attr("r", 5);

          // All nodes transition into their new position
          node
              .transition().duration(duration)
              .attr("transform", translate_to_my_target_position);

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
