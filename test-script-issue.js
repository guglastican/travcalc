// Test to simulate the Google Apps Script behavior
function simulateScriptIssue() {
  // Simulate spreadsheet data with empty cells
  const values = [
    ['Place1', 'Place2', 'Title', 'Airports', 'Introduction6'], // Headers
    ['Alabama', 'London', 'How Far London To Paris', '', 'Some airport info'], // Empty Airports cell
    ['Paris', 'London', 'How Far London To Edinburgh', 'CDG, LHR', ''] // Empty Introduction6 cell
  ];

  const output = [];

  for (var i = 0; i < values.length; i++) {
    var row = {};
    
    if (i == 0) {
      continue; // Skip header row
    }
    
    for (var j = 0; j < values[0].length; j++) { 
      // This is the problematic line from your Google Apps Script
      if (!values[i][j] || values[i][j] === '') {
        console.log(`Skipping empty cell at row ${i}, column ${j} (${values[0][j]})`);
        continue;
      }
      row[values[0][j]] = values[i][j];
    }
    
    if(Object.keys(row).length > 0){
      output.push(row);
    }
  }
  
  console.log('Final output:', JSON.stringify(output, null, 2));
  console.log('\nNotice how columns with empty cells are completely missing from the output!');
}

simulateScriptIssue();
