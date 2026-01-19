
import os

file_path = r'c:\Users\Joao\.gemini\antigravity\gym-manager\src\pages\StudentDetails.jsx'
new_content_path = r'c:\Users\Joao\.gemini\antigravity\gym-manager\new_block.txt'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open(new_content_path, 'r', encoding='utf-8') as f:
    new_block = f.read()

# Find the start and end markers
start_index = -1
end_index = -1

# Look for the specific lines we identified in view_file
# 1634:                             ) : (
# 1635:                                 <div style={{ position: 'relative' }}>
# ...
# 1881:                                 </div>
# 1882:                             )

for i, line in enumerate(lines):
    if '{assessments.length === 0 ? (' in line:
        # Search forward for ) : (
        for j in range(i, i+10):
            if ') : (' in lines[j]:
                start_index = j + 1
                break
    
    if start_index != -1 and i > start_index:
        # Search for the closing parenthesis of the map/ternary
        # The block ends before the "activeTab === 'workouts'" check
        if "activeTab === 'workouts'" in line:
            # Backtrack to find the closing parentheses
            # We want to replace everything UP TO the closing ')' of the ternary
            # The structure is:
            # ) : (
            #    <CONTENT_TO_REPLACE>
            # )
            # }
            # 
            # { activeTab === 'workouts' ...
            
            # So looking backwards from 'activeTab === workouts'
            # The previous non-empty lines should be } then ) then </div> (end of content)
            
            # Let's find the ')' corresponding to the ternary else
            k = i - 1
            while k > start_index:
                if ')' in lines[k] and '}' not in lines[k]: # simplistic check for line 1882
                     # Line 1882 is just "                            )"
                     if lines[k].strip() == ')':
                         end_index = k
                         break
                k -= 1
            break

if start_index != -1 and end_index != -1:
    print(f"Replacing lines {start_index} to {end_index}")
    new_lines = lines[:start_index]
    new_lines.append(new_block + '\n')
    new_lines.extend(lines[end_index:])
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Success")
else:
    print(f"Could not find markers. Start: {start_index}, End: {end_index}")
