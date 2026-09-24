def check_budget(started,now,limit):
 if now-started>=limit:raise TimeoutError('Experiment resource limit reached')
